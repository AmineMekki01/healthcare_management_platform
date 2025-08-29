from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from src.app.settings import settings

def get_async_database_url():
    """Convert DATABASE_URL to asyncpg format and handle SSL parameters."""
    url = settings.DATABASE_URL
    if url.startswith('postgresql://'):
        url = url.replace('postgresql://', 'postgresql+asyncpg://', 1)
    
    if '?sslmode=' in url:
        url = url.split('?sslmode=')[0]
    if '&sslmode=' in url:
        parts = url.split('&sslmode=')
        url = parts[0] + '&'.join(parts[1].split('&')[1:])
    
    return url

engine = create_async_engine(
    get_async_database_url()
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

def get_database_connection():
    """Get a database connection."""
    return engine.connect()


def get_db_session() -> AsyncSession:
    """Get async database session as context manager."""
    return AsyncSessionLocal()

async def get_db_session_dependency():
    """Dependency function for FastAPI to get async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
