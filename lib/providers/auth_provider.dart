import 'package:flutter/foundation.dart';

import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  bool _isLoading = true;

  bool get isLoading => _isLoading;
  bool get isSignedIn => _authService.isSignedIn;
  String? get userId => _authService.userId;
  String? get userDisplayName => _authService.userDisplayName;
  String? get userEmail => _authService.userEmail;
  Future<String?> get idToken => _authService.idToken;

  AuthProvider() {
    _initializeAuth();
  }

  void _initializeAuth() {
    _authService.authStateChanges.listen((user) {
      _isLoading = false;
      if (user != null) {
        // Initialize messaging when user signs in
        _authService.initializeMessaging();
      }
      notifyListeners();
    });
  }

  Future<void> signInWithEmailAndPassword(String email, String password) async {
    try {
      await _authService.signInWithEmailAndPassword(email, password);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> createUserWithEmailAndPassword(
      String email, String password) async {
    try {
      await _authService.createUserWithEmailAndPassword(email, password);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> signInWithGoogle() async {
    try {
      await _authService.signInWithGoogle();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> signOut() async {
    try {
      await _authService.signOut();
    } catch (e) {
      rethrow;
    }
  }
}
