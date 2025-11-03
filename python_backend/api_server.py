#!/usr/bin/env python3
"""
HTTP API Server for ESG Claim Verification System.
Provides REST endpoints for the React Native app to process PDF documents.
"""

import os
import sys
import json
import tempfile
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

try:
    from flask import Flask, request, jsonify, send_file
    from flask_cors import CORS
    from werkzeug.utils import secure_filename
    from werkzeug.exceptions import RequestEntityTooLarge
except ImportError:
    print("Error: Flask and related packages not installed.")
    print("Install with: pip install flask flask-cors")
    sys.exit(1)

try:
    from nlp_processor import NLPProcessor, extract_company_name_from_filename
    from config import MODEL_PATH, ESG_CSV_PATH
except ImportError as e:
    print(f"Error importing NLP modules: {e}")
    print("Make sure all required Python packages are installed.")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Flask app configuration
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size
app.config['UPLOAD_FOLDER'] = tempfile.gettempdir()

# Enable CORS for React Native app
CORS(app, origins=['*'])  # In production, specify exact origins

# Global NLP processor instance
nlp_processor = None

# Allowed file extensions
ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def initialize_nlp_processor():
    """Initialize the NLP processor with error handling"""
    global nlp_processor
    
    if nlp_processor is not None:
        return nlp_processor
    
    try:
        logger.info("Initializing NLP processor...")
        nlp_processor = NLPProcessor()
        logger.info("NLP processor initialized successfully")
        return nlp_processor
    except Exception as e:
        logger.error(f"Failed to initialize NLP processor: {e}")
        raise

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check if NLP processor can be initialized
        processor = initialize_nlp_processor()
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0',
            'components': {
                'nlp_processor': 'available',
                'model_path': str(MODEL_PATH),
                'esg_data_path': str(ESG_CSV_PATH)
            }
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/process-document', methods=['POST'])
def process_document():
    """Process uploaded PDF document"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'error': 'No file provided',
                'code': 'NO_FILE'
            }), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'error': 'No file selected',
                'code': 'NO_FILE_SELECTED'
            }), 400
        
        # Check file extension
        if not allowed_file(file.filename):
            return jsonify({
                'error': 'Only PDF files are allowed',
                'code': 'INVALID_FILE_TYPE'
            }), 400
        
        # Get optional parameters
        company_name = request.form.get('company_name')
        if not company_name:
            company_name = extract_company_name_from_filename(file.filename)
        
        # Generate job ID
        job_id = f"api_{int(datetime.now().timestamp())}_{os.getpid()}"
        
        logger.info(f"Processing document: {file.filename} for company: {company_name}")
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{job_id}_{filename}")
        file.save(temp_path)
        
        try:
            # Initialize NLP processor
            processor = initialize_nlp_processor()
            
            # Process the document
            def progress_callback(status_dict):
                # In a real implementation, you might want to store progress
                # in a database or cache for real-time updates
                logger.info(f"Progress: {status_dict.get('progress', 0):.1%} - {status_dict.get('current_step', 'Processing')}")
            
            results = processor.process_pdf_document(
                temp_path,
                company_name,
                progress_callback
            )
            
            # Add API-specific metadata
            results['api_info'] = {
                'job_id': job_id,
                'processed_at': datetime.now().isoformat(),
                'original_filename': file.filename,
                'file_size': os.path.getsize(temp_path),
                'api_version': '1.0.0'
            }
            
            logger.info(f"Document processed successfully: {job_id}")
            
            return jsonify(results), 200
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_path)
            except OSError:
                logger.warning(f"Failed to delete temporary file: {temp_path}")
    
    except RequestEntityTooLarge:
        return jsonify({
            'error': 'File too large. Maximum size is 50MB.',
            'code': 'FILE_TOO_LARGE'
        }), 413
    
    except Exception as e:
        logger.error(f"Error processing document: {e}")
        return jsonify({
            'error': 'Internal server error during processing',
            'code': 'PROCESSING_ERROR',
            'details': str(e)
        }), 500

@app.route('/api/extract-company-name', methods=['POST'])
def extract_company_name():
    """Extract company name from filename"""
    try:
        data = request.get_json()
        
        if not data or 'filename' not in data:
            return jsonify({
                'error': 'Filename is required',
                'code': 'NO_FILENAME'
            }), 400
        
        filename = data['filename']
        company_name = extract_company_name_from_filename(filename)
        
        return jsonify({
            'filename': filename,
            'company_name': company_name,
            'extracted_at': datetime.now().isoformat()
        }), 200
    
    except Exception as e:
        logger.error(f"Error extracting company name: {e}")
        return jsonify({
            'error': 'Failed to extract company name',
            'code': 'EXTRACTION_ERROR',
            'details': str(e)
        }), 500

@app.route('/api/status/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """Get processing status for a job (placeholder for future implementation)"""
    # In a real implementation, you would store job status in a database
    # and return real-time progress updates
    return jsonify({
        'job_id': job_id,
        'status': 'completed',
        'message': 'Status tracking not implemented in this version'
    }), 200

@app.route('/api/models/info', methods=['GET'])
def get_model_info():
    """Get information about loaded models and data"""
    try:
        model_info = {
            'model_path': str(MODEL_PATH),
            'model_exists': MODEL_PATH.exists(),
            'esg_data_path': str(ESG_CSV_PATH),
            'esg_data_exists': ESG_CSV_PATH.exists(),
            'timestamp': datetime.now().isoformat()
        }
        
        # If NLP processor is initialized, get more details
        if nlp_processor is not None:
            model_info['processor_status'] = 'initialized'
        else:
            model_info['processor_status'] = 'not_initialized'
        
        return jsonify(model_info), 200
    
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        return jsonify({
            'error': 'Failed to get model information',
            'details': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Endpoint not found',
        'code': 'NOT_FOUND'
    }), 404

@app.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 errors"""
    return jsonify({
        'error': 'Method not allowed',
        'code': 'METHOD_NOT_ALLOWED'
    }), 405

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {error}")
    return jsonify({
        'error': 'Internal server error',
        'code': 'INTERNAL_ERROR'
    }), 500

def main():
    """Main function to run the server"""
    import argparse
    import os
    
    parser = argparse.ArgumentParser(description='ESG Claim Verification API Server')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to (default: 0.0.0.0)')
    parser.add_argument('--port', type=int, default=int(os.environ.get('PORT', 8000)), help='Port to bind to')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    parser.add_argument('--preload', action='store_true', help='Preload NLP processor on startup')
    
    args = parser.parse_args()
    
    # Check if running in production
    is_production = os.environ.get('FLASK_ENV') == 'production'
    
    # Preload NLP processor if requested or in production
    if args.preload or is_production:
        try:
            logger.info("Preloading NLP processor...")
            initialize_nlp_processor()
            logger.info("NLP processor preloaded successfully")
        except Exception as e:
            logger.error(f"Failed to preload NLP processor: {e}")
            logger.info("Server will start anyway, processor will be loaded on first request")
    
    logger.info(f"Starting ESG Claim Verification API Server...")
    logger.info(f"Server will be available at: http://{args.host}:{args.port}")
    logger.info(f"Health check: http://{args.host}:{args.port}/health")
    logger.info(f"API endpoint: http://{args.host}:{args.port}/api/process-document")
    
    # Use Gunicorn in production, Flask dev server locally
    if is_production:
        # Import and run with Gunicorn programmatically
        try:
            from gunicorn.app.wsgiapp import WSGIApplication
            
            class StandaloneApplication(WSGIApplication):
                def __init__(self, app, options=None):
                    self.options = options or {}
                    self.application = app
                    super().__init__()
                
                def load_config(self):
                    for key, value in self.options.items():
                        self.cfg.set(key.lower(), value)
                
                def load(self):
                    return self.application
            
            options = {
                'bind': f'{args.host}:{args.port}',
                'workers': 1,  # Single worker for free tier
                'worker_class': 'sync',
                'timeout': 300,  # 5 minutes for ML processing
                'keepalive': 2,
                'max_requests': 100,
                'max_requests_jitter': 10,
                'preload_app': True,
            }
            
            StandaloneApplication(app, options).run()
            
        except ImportError:
            logger.warning("Gunicorn not available, falling back to Flask dev server")
            app.run(host=args.host, port=args.port, debug=False, threaded=True)
    else:
        # Development server
        app.run(
            host=args.host,
            port=args.port,
            debug=args.debug,
            threaded=True
        )

if __name__ == '__main__':
    main()