import io
import hashlib
from typing import Dict, Any
import tiktoken
import PyPDF2
import docx
from PIL import Image
import pytesseract

from src.shared.logs import logger
from src.chat.constants import ModelsEnum

class DocumentProcessor:
    """
    Handles document text extraction, token counting, and content processing
    """
    
    def __init__(self):
        self.encoding = tiktoken.encoding_for_model(ModelsEnum.OPENAI_GPT.value)
        
        self.supported_types = {
            'application/pdf': self._extract_pdf_text,
            'application/msword': self._extract_docx_text,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': self._extract_docx_text,
            'text/plain': self._extract_text_file,
            'image/jpeg': self._extract_image_text,
            'image/jpg': self._extract_image_text,
            'image/png': self._extract_image_text
        }
    
    async def process_document(self, file_content: bytes, filename: str, mime_type: str) -> Dict[str, Any]:
        """
        Process uploaded document and extract metadata
        
        Args:
            file_content: Raw file bytes
            filename: Original filename
            mime_type: MIME type of the file
            
        Returns:
            Dictionary containing extracted text, token count, and metadata
        """
        try:
            extracted_text = await self._extract_text(file_content, mime_type)
            
            if not extracted_text.strip():
                raise ValueError("No text content could be extracted from the document")
            
            token_count = self._count_tokens(extracted_text)
            
            content_hash = self._generate_content_hash(extracted_text)
            
            metadata = {
                'filename': filename,
                'mime_type': mime_type,
                'file_size': len(file_content),
                'token_count': token_count,
                'content_hash': content_hash,
                'character_count': len(extracted_text),
                'word_count': len(extracted_text.split()),
                'extracted_text': extracted_text
            }
            
            logger.info(f"Processed document {filename}: {token_count} tokens, {len(extracted_text)} chars")
            
            return metadata
            
        except Exception as e:
            logger.error(f"Failed to process document {filename}: {e}")
            raise ValueError(f"Document processing failed: {str(e)}")
    
    async def _extract_text(self, file_content: bytes, mime_type: str) -> str:
        """Extract text based on MIME type"""
        if mime_type not in self.supported_types:
            raise ValueError(f"Unsupported file type: {mime_type}")
        
        extractor = self.supported_types[mime_type]
        return await extractor(file_content)
    
    async def _extract_pdf_text(self, file_content: bytes) -> str:
        """Extract text from PDF"""
        try:
            pdf_file = io.BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text_parts = []
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text.strip():
                    text_parts.append(text.strip())
            
            return '\n\n'.join(text_parts)
            
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            raise ValueError("Failed to extract text from PDF")
    
    async def _extract_docx_text(self, file_content: bytes) -> str:
        """Extract text from DOCX"""
        try:
            doc_file = io.BytesIO(file_content)
            doc = docx.Document(doc_file)
            
            text_parts = []
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text_parts.append(paragraph.text.strip())
            
            return '\n\n'.join(text_parts)
            
        except Exception as e:
            logger.error(f"DOCX extraction failed: {e}")
            raise ValueError("Failed to extract text from DOCX")
    
    async def _extract_text_file(self, file_content: bytes) -> str:
        """Extract text from plain text file"""
        try:
            encodings = ['utf-8', 'utf-16', 'latin-1', 'cp1252']
            
            for encoding in encodings:
                try:
                    return file_content.decode(encoding)
                except UnicodeDecodeError:
                    continue
            
            raise ValueError("Could not decode text file with any supported encoding")
            
        except Exception as e:
            logger.error(f"Text file extraction failed: {e}")
            raise ValueError("Failed to extract text from file")
    
    async def _extract_image_text(self, file_content: bytes) -> str:
        """Extract text from image using OCR"""
        try:
            image = Image.open(io.BytesIO(file_content))
            
            extracted_text = pytesseract.image_to_string(image)
            
            if not extracted_text.strip():
                raise ValueError("No text found in image")
            
            return extracted_text.strip()
            
        except Exception as e:
            logger.error(f"Image OCR failed: {e}")
            raise ValueError("Failed to extract text from image")
    
    def _count_tokens(self, text: str) -> int:
        """Count tokens using tiktoken"""
        try:
            tokens = self.encoding.encode(text)
            return len(tokens)
        except Exception as e:
            logger.error(f"Token counting failed: {e}")
            return len(text.split()) * 1.3
    
    def _generate_content_hash(self, text: str) -> str:
        """Generate SHA-256 hash of content for deduplication"""
        return hashlib.sha256(text.encode('utf-8')).hexdigest()
    
    def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 100) -> list[str]:
        """
        Split text into overlapping chunks for vector storage
        
        Args:
            text: Text to chunk
            chunk_size: Maximum tokens per chunk
            overlap: Token overlap between chunks
            
        Returns:
            List of text chunks
        """
        try:
            sentences = text.split('. ')
            chunks = []
            current_chunk = []
            current_tokens = 0
            
            for sentence in sentences:
                sentence_tokens = self._count_tokens(sentence)
                
                if current_tokens + sentence_tokens > chunk_size and current_chunk:
                    chunk_text = '. '.join(current_chunk)
                    chunks.append(chunk_text)
                    
                    overlap_sentences = current_chunk[-overlap//10:] if overlap > 0 else []
                    current_chunk = overlap_sentences + [sentence]
                    current_tokens = sum(self._count_tokens(s) for s in current_chunk)
                else:
                    current_chunk.append(sentence)
                    current_tokens += sentence_tokens
            
            if current_chunk:
                chunk_text = '. '.join(current_chunk)
                chunks.append(chunk_text)
            
            return chunks
            
        except Exception as e:
            logger.error(f"Text chunking failed: {e}")
            words = text.split()
            chunk_size_words = chunk_size // 1.3
            chunks = []
            
            for i in range(0, len(words), int(chunk_size_words)):
                chunk = ' '.join(words[i:i + int(chunk_size_words)])
                chunks.append(chunk)
            
            return chunks
