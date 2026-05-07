import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';

class AuthUser {
  final int id;
  final String name;
  final String email;

  const AuthUser({required this.id, required this.name, required this.email});

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
        id: json['id'],
        name: json['name'],
        email: json['email'],
      );
}

enum AuthMode { loggedIn, guest }

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  static const _tokenKey = 'auth_token';
  static const _userKey = 'auth_user';
  static const _modeKey = 'auth_mode';
  static const _guestWarningKey = 'guest_warning_shown';

  String? _token;
  AuthUser? _user;
  AuthMode _mode = AuthMode.guest;

  String? get token => _token;
  AuthUser? get user => _user;
  AuthMode get mode => _mode;
  bool get isLoggedIn => _mode == AuthMode.loggedIn && _token != null;
  bool get isGuest => _mode == AuthMode.guest;

  /// Load persisted session on app start
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final modeStr = prefs.getString(_modeKey);
    if (modeStr == 'loggedIn') {
      _token = prefs.getString(_tokenKey);
      final userJson = prefs.getString(_userKey);
      if (_token != null && userJson != null) {
        _user = AuthUser.fromJson(json.decode(userJson));
        _mode = AuthMode.loggedIn;
      }
    }
    // else stays as guest
  }

  Future<AuthUser> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final res = await http.post(
      Uri.parse('${AppConstants.baseUrl}/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'name': name, 'email': email, 'password': password}),
    );

    final data = json.decode(res.body);
    if (res.statusCode == 200) {
      await _saveSession(data);
      return _user!;
    } else {
      throw Exception(data['detail'] ?? 'Registration failed');
    }
  }

  Future<AuthUser> login({
    required String email,
    required String password,
  }) async {
    final res = await http.post(
      Uri.parse('${AppConstants.baseUrl}/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'email': email, 'password': password}),
    );

    final data = json.decode(res.body);
    if (res.statusCode == 200) {
      await _saveSession(data);
      return _user!;
    } else {
      throw Exception(data['detail'] ?? 'Login failed');
    }
  }

  Future<void> continueAsGuest() async {
    _token = null;
    _user = null;
    _mode = AuthMode.guest;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_modeKey, 'guest');
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    _mode = AuthMode.guest;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
    await prefs.setString(_modeKey, 'guest');
  }

  Future<bool> hasShownGuestWarning() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_guestWarningKey) ?? false;
  }

  Future<void> markGuestWarningShown() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_guestWarningKey, true);
  }

  Map<String, String> get authHeaders => _token != null
      ? {'Authorization': 'Bearer $_token'}
      : {};

  Future<void> _saveSession(Map<String, dynamic> data) async {
    _token = data['access_token'];
    _user = AuthUser.fromJson(data['user']);
    _mode = AuthMode.loggedIn;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, _token!);
    await prefs.setString(_userKey, json.encode(data['user']));
    await prefs.setString(_modeKey, 'loggedIn');
  }
}
