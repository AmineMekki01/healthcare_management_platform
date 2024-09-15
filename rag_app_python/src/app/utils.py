from PyPDF2 import PdfWriter, PdfReader
from qdrant_client.http.models import Distance, VectorParams

from langchain_qdrant import QdrantVectorStore
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from qdrant_client import QdrantClient
from langchain_community.chat_models.openai import ChatOpenAI
from langchain import hub
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

from src.app.settings import settings
from src.app.core.logs import logger

from dotenv import load_dotenv

load_dotenv()

def extract_selected_pages_to_single_pdf(
    input_file_path, output_file_path, pages_to_extract
):
    """
    Extracts selected pages from an input PDF file and saves them as a new PDF file.

    Args:
        input_file_path (str): The path to the input PDF file.
        output_file_path (str): The path to save the output PDF file.
        pages_to_extract (list): A list of page numbers to extract. Pages are 1-based.

    Returns:
        None
    """
    input_pdf = PdfReader(input_file_path)
    output_pdf = PdfWriter()
    for page_number in pages_to_extract:
        output_pdf.add_page(input_pdf.pages[page_number - 1])
    with open(output_file_path, "wb") as output_pdf_file:
        output_pdf.write(output_pdf_file)




def get_qdrant_client():
    try:
        return QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
    except Exception as e:
        logger.error(f"Couldn't Get Qdrant Client with an error : {e}")

def create_qdrant_collection():
    client = get_qdrant_client()

    try:
        collection_exist = client.collection_exists(collection_name=settings.QDRANT_COLLECTION_NAME)
        
        if collection_exist:
            return
        
        client.create_collection(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            vectors_config=VectorParams(size=settings.EMBEDDING_MODEL_DIM, distance=Distance.COSINE),
        )
    except Exception as e:
        logger.error(f"Couldn't Create a Qdrant Collection with an error : {e}")

    
def init_vector_store():
    try:
        embedding_model = get_embedding_model()
        client = get_qdrant_client()
        return QdrantVectorStore(
            client=client,
            collection_name=settings.QDRANT_COLLECTION_NAME,
            embedding=embedding_model,
        )
    except Exception as e:
        logger.error(f"Couldn't Initialize vector store and got the error : {e}")

from qdrant_client.http import models

def init_retriever(chat_id):
    vector_store = init_vector_store()
    retriever = vector_store.as_retriever(
        search_kwargs={
            "k" : 5,
            "filter": models.Filter(
                    should=[
                        models.FieldCondition(
                            key="metadata.chat_id",
                            match=models.MatchValue(value=chat_id)
                        )
                    ],
            )
        }
    )
    return retriever


def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


def get_llm_chain(chat_id):
    
    llm = init_llm()
    prompt = hub.pull("rlm/rag-prompt")

    retriever = init_retriever(chat_id)
    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    return rag_chain

def get_embedding_model():
    return FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")


def text_to_embedding(text: str):
    embedding_model = get_embedding_model()
    return embedding_model.embed_query([text])[0]



def init_llm():
    """Create an instance of chosen llm model.

    Args:
        model (str): the llm model to use.

    Returns:
        ChatModel: Either ChatOpenAI, AzureChatOpenAI or BedrockChat object.
    """
    llm = ChatOpenAI(
        model="gpt-4o",
        temperature=0,
    )
 
    return llm