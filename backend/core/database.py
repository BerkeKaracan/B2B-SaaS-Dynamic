import socket
from supabase import create_client, Client
from core.config import settings

old_getaddrinfo = socket.getaddrinfo

def new_getaddrinfo(*args, **kwargs):
    responses = old_getaddrinfo(*args, **kwargs)
    return [res for res in responses if res[0] == socket.AF_INET]

socket.getaddrinfo = new_getaddrinfo

supabase: Client = create_client(settings.supabase_url, settings.supabase_key)

supabase_admin: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)