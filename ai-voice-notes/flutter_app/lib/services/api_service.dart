import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import '../models/note_model.dart';
import '../utils/constants.dart';
import 'auth_service.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final String baseUrl = AppConstants.baseUrl;
  final _auth = AuthService();

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        ..._auth.authHeaders,
      };

  // ── YouTube ───────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> processYouTube({
    required String url,
    required String language,
    String title = '',
  }) async {
    final uri = Uri.parse('$baseUrl/youtube');
    final response = await http.post(uri,
      headers: _headers,
      body: json.encode({'url': url, 'language': language, 'title': title}),
    ).timeout(const Duration(minutes: 10));
    if (response.statusCode == 200) return json.decode(response.body);
    throw Exception(json.decode(response.body)['detail'] ?? 'YouTube processing failed');
  }

  Future<Map<String, dynamic>> getYouTubeInfo(String url) async {
    final uri = Uri.parse('$baseUrl/youtube/info').replace(queryParameters: {'url': url});
    final response = await http.get(uri, headers: _auth.authHeaders).timeout(const Duration(seconds: 15));
    if (response.statusCode == 200) return json.decode(response.body);
    throw Exception('Could not fetch video info');
  }

  // ── Upload ────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> uploadFile({
    required String filePath,
    required String language,
    String title = '',
  }) async {
    final uri = Uri.parse('$baseUrl/upload');
    final request = http.MultipartRequest('POST', uri);
    request.headers.addAll(_auth.authHeaders);

    final fileName = filePath.split('/').last.split('\\').last;
    final ext = fileName.split('.').last.toLowerCase();
    String mimeType = 'audio/mpeg';
    if (['mp4', 'mov', 'avi', 'mkv'].contains(ext)) mimeType = 'video/mp4';
    else if (ext == 'wav') mimeType = 'audio/wav';
    else if (ext == 'webm') mimeType = 'audio/webm';

    request.files.add(await http.MultipartFile.fromPath('file', filePath,
        contentType: MediaType.parse(mimeType)));
    request.fields['language'] = language;
    request.fields['title'] = title;

    final streamed = await request.send().timeout(const Duration(minutes: 10));
    final response = await http.Response.fromStream(streamed);
    if (response.statusCode == 200) return json.decode(response.body);
    throw Exception(json.decode(response.body)['detail'] ?? 'Upload failed');
  }

  // ── Notes ─────────────────────────────────────────────────────────────────

  Future<List<Note>> getNotes({String search = '', String sourceType = '', int limit = 20, int offset = 0}) async {
    final params = {
      if (search.isNotEmpty) 'search': search,
      if (sourceType.isNotEmpty) 'source_type': sourceType,
      'limit': limit.toString(),
      'offset': offset.toString(),
    };
    final uri = Uri.parse('$baseUrl/notes').replace(queryParameters: params);
    final response = await http.get(uri, headers: _auth.authHeaders);
    if (response.statusCode == 200) {
      return (json.decode(response.body)['notes'] as List).map((n) => Note.fromJson(n)).toList();
    }
    throw Exception('Failed to load notes');
  }

  Future<Note> getNoteById(int id) async {
    final response = await http.get(Uri.parse('$baseUrl/notes/$id'), headers: _auth.authHeaders);
    if (response.statusCode == 200) return Note.fromJson(json.decode(response.body)['note']);
    throw Exception('Note not found');
  }

  Future<void> deleteNote(int id) async {
    final response = await http.delete(Uri.parse('$baseUrl/notes/$id'), headers: _auth.authHeaders);
    if (response.statusCode != 200) throw Exception('Failed to delete note');
  }

  String getPdfExportUrl(int noteId) => '$baseUrl/notes/$noteId/export/pdf';

  // ── Learning Tools ────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> getFlashcards(int noteId) async {
    final response = await http.post(Uri.parse('$baseUrl/notes/$noteId/flashcards'),
        headers: _auth.authHeaders);
    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(json.decode(response.body)['flashcards']);
    }
    throw Exception('Failed to generate flashcards');
  }

  Future<List<Map<String, dynamic>>> getPracticeQuestions(int noteId) async {
    final response = await http.post(Uri.parse('$baseUrl/notes/$noteId/practice-questions'),
        headers: _auth.authHeaders);
    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(json.decode(response.body)['questions']);
    }
    throw Exception('Failed to generate questions');
  }

  Future<Map<String, dynamic>> getMockExam(int noteId) async {
    final response = await http.post(Uri.parse('$baseUrl/notes/$noteId/mock-exam'),
        headers: _auth.authHeaders);
    if (response.statusCode == 200) return json.decode(response.body);
    throw Exception('Failed to generate mock exam');
  }

  Future<Map<String, dynamic>> getMindMap(int noteId) async {
    final response = await http.post(Uri.parse('$baseUrl/notes/$noteId/mindmap'),
        headers: _auth.authHeaders);
    if (response.statusCode == 200) return json.decode(response.body)['mindmap'];
    throw Exception('Failed to generate mind map');
  }
}
