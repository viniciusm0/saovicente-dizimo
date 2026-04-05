import os
from supabase import create_client, Client

def get_supabase_client() -> Client:
    url: str = os.getenv("SUPABASE_URL")
    key: str = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        # Avoid crashing immediately on load, but will fail if used without config
        return None
        
    return create_client(url, key)

supabase: Client = get_supabase_client()
