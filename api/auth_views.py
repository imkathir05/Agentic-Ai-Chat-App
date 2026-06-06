import jwt
import datetime
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password, check_password
from core.models import User

def generate_tokens(user):
    now = datetime.datetime.now(datetime.timezone.utc)
    access_payload = {
        'user_id': user.id,
        'exp': now + datetime.timedelta(hours=getattr(settings, 'JWT_ACCESS_HOURS', 1)),
        'iat': now,
    }
    refresh_payload = {
        'user_id': user.id,
        'exp': now + datetime.timedelta(days=getattr(settings, 'JWT_REFRESH_DAYS', 7)),
        'iat': now,
    }
    access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm='HS256')
    refresh_token = jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm='HS256')
    return access_token, refresh_token

def set_auth_cookies(response, access_token, refresh_token):
    response.set_cookie(
        'access_token', access_token,
        max_age=getattr(settings, 'JWT_ACCESS_HOURS', 1) * 3600,
        httponly=True, samesite='Lax'
    )
    response.set_cookie(
        'refresh_token', refresh_token,
        max_age=getattr(settings, 'JWT_REFRESH_DAYS', 7) * 86400,
        httponly=True, samesite='Lax'
    )

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get('username')
    email = request.data.get('email', '')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'detail': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
        
    if User.objects.filter(username=username).exists():
        return Response({'detail': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
    user = User(username=username, email=email, password=make_password(password))
    user.save()
    
    access, refresh = generate_tokens(user)
    res = Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email
        }
    })
    set_auth_cookies(res, access, refresh)
    return res

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = User.objects.filter(username=username).first()
    if user is None or not check_password(password, user.password):
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
    access, refresh = generate_tokens(user)
    res = Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email
        }
    })
    set_auth_cookies(res, access, refresh)
    return res

@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    res = Response({'detail': 'Logged out'})
    res.delete_cookie('access_token')
    res.delete_cookie('refresh_token')
    return res

@api_view(['POST'])
@permission_classes([AllowAny])
def refresh(request):
    refresh_token = request.COOKIES.get('refresh_token')
    if not refresh_token:
        return Response({'detail': 'No refresh token'}, status=status.HTTP_401_UNAUTHORIZED)
        
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=['HS256'])
        user = User.objects.get(id=payload['user_id'])
        access, refresh_tk = generate_tokens(user)
        res = Response({'detail': 'Token refreshed'})
        set_auth_cookies(res, access, refresh_tk)
        return res
    except Exception:
        return Response({'detail': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email
        }
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests

    token = request.data.get('token')
    if not token:
        return Response({'detail': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
    client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', '')
    if not client_id:
        return Response({'detail': 'Google OAuth Client ID is not configured on the backend'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    try:
        # Verify the Google ID token
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
        
        # Verify issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
            
        email = idinfo.get('email')
        if not email:
            return Response({'detail': 'Email not provided by Google'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Try to find user by email
        user = User.objects.filter(email=email).first()
        
        # If user does not exist, create a new user
        if not user:
            name = idinfo.get('name', '')
            base_username = email.split('@')[0]
            username = base_username
            if User.objects.filter(username=username).exists():
                username = f"{base_username}_{idinfo.get('sub')[:8]}"
            
            user = User.objects.create_user(
                username=username,
                email=email,
                display_name=name
            )
            # Disable password login for this user since they use OAuth
            user.set_unusable_password()
            user.save()
            
        access, refresh = generate_tokens(user)
        res = Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        })
        set_auth_cookies(res, access, refresh)
        return res
        
    except ValueError as e:
        return Response({'detail': f'Invalid token: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
