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
