import 'package:flutter/material.dart';

class AppConstants {
  // API Configuration
  static const String baseUrl = 'http://192.168.8.168:8000/api';
  static const String wsUrl = 'ws://192.168.8.168:8000/api';

  // ── Website-matching Color Palette (White + Indigo/Purple) ──────────────

  // Backgrounds
  static const Color cream = Color(0xFFF9FAFB);      // gray-50 — page bg
  static const Color sand  = Color(0xFFF3F4F6);      // gray-100 — card bg
  static const Color warm  = Color(0xFFE5E7EB);      // gray-200 — disabled

  // Primary — Indigo
  static const Color terra  = Color(0xFF4F46E5);     // indigo-600
  static const Color terra2 = Color(0xFF6366F1);     // indigo-500

  // Secondary — Purple
  static const Color amber  = Color(0xFF7C3AED);     // violet-600

  // Text
  static const Color text1  = Color(0xFF111827);     // gray-900
  static const Color text2  = Color(0xFF6B7280);     // gray-500
  static const Color text3  = Color(0xFF9CA3AF);     // gray-400

  // Border
  static const Color border = Color(0xFFE5E7EB);     // gray-200

  // Accent chips — matching website keyword colors
  static const Color hotBg   = Color(0xFFEEF2FF);   // indigo-50
  static const Color hotText = Color(0xFF4338CA);   // indigo-700

  static const Color warmBg   = Color(0xFFF5F3FF);  // violet-50
  static const Color warmText = Color(0xFF6D28D9);  // violet-700

  static const Color coolBg   = Color(0xFFECFDF5);  // emerald-50
  static const Color coolText = Color(0xFF065F46);  // emerald-800

  // Extra semantic colors
  static const Color success = Color(0xFF10B981);   // emerald-500
  static const Color error   = Color(0xFFEF4444);   // red-500
  static const Color warning = Color(0xFFF59E0B);   // amber-500

  // Gradient colors (for cards/buttons)
  static const Color gradStart = Color(0xFF4F46E5); // indigo-600
  static const Color gradEnd   = Color(0xFF7C3AED); // violet-600

  // Supported Languages
  static const Map<String, String> supportedLanguages = {
    'auto': 'Auto Detect (Recommended)',
    'en': 'English',
    'hi': 'Hindi',
    'te': 'Telugu',
    'ta': 'Tamil',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'mr': 'Marathi',
    'bn': 'Bengali',
    'gu': 'Gujarati',
    'pa': 'Punjabi',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
  };

  static const int maxFileSizeMB = 100;
  static const List<String> audioExtensions = ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'webm'];
  static const List<String> videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
}
