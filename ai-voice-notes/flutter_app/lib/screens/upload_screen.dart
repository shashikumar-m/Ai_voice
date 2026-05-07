import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';
import 'note_detail_screen.dart';

class UploadScreen extends StatefulWidget {
  const UploadScreen({super.key});

  @override
  State<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tab;

  // File tab
  String? _filePath;
  String? _fileName;

  // YouTube tab
  final _ytCtrl = TextEditingController();
  Map<String, dynamic>? _ytInfo;
  bool _ytFetching = false;

  // Shared
  String _language = 'auto';
  String _title = '';
  bool _processing = false;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
    _tab.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _tab.dispose();
    _ytCtrl.dispose();
    super.dispose();
  }

  // ── File ──────────────────────────────────────────────────────────────────

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: [
        ...AppConstants.audioExtensions,
        ...AppConstants.videoExtensions,
      ],
    );
    if (result != null && result.files.single.path != null) {
      setState(() {
        _filePath = result.files.single.path;
        _fileName = result.files.single.name;
      });
    }
  }

  Future<void> _processFile() async {
    if (_filePath == null) return;
    setState(() => _processing = true);
    try {
      final result = await ApiService().uploadFile(
        filePath: _filePath!,
        language: _language,
        title: _title.isNotEmpty
            ? _title
            : _fileName!.replaceAll(RegExp(r'\.[^.]+$'), ''),
      );
      if (mounted) {
        Navigator.push(context, MaterialPageRoute(
          builder: (_) => NoteDetailScreen(noteId: result['note_id']),
        ));
        setState(() { _filePath = null; _fileName = null; _title = ''; });
      }
    } catch (e) {
      _showError(e.toString());
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  bool get _isVideo =>
      _fileName != null &&
      AppConstants.videoExtensions
          .contains(_fileName!.split('.').last.toLowerCase());

  // ── YouTube ───────────────────────────────────────────────────────────────

  Future<void> _fetchYtInfo(String url) async {
    if (!url.contains('youtube') && !url.contains('youtu.be')) return;
    setState(() { _ytFetching = true; _ytInfo = null; });
    try {
      final info = await ApiService().getYouTubeInfo(url);
      if (mounted) setState(() => _ytInfo = info);
    } catch (_) {
      if (mounted) setState(() => _ytInfo = null);
    } finally {
      if (mounted) setState(() => _ytFetching = false);
    }
  }

  Future<void> _processYouTube() async {
    final url = _ytCtrl.text.trim();
    if (url.isEmpty) return;
    setState(() => _processing = true);
    try {
      final result = await ApiService().processYouTube(
        url: url,
        language: _language,
        title: _title,
      );
      if (mounted) {
        Navigator.push(context, MaterialPageRoute(
          builder: (_) => NoteDetailScreen(noteId: result['note_id']),
        ));
        _ytCtrl.clear();
        setState(() { _ytInfo = null; _title = ''; });
      }
    } catch (e) {
      _showError(e.toString());
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg.replaceFirst('Exception: ', '')),
      backgroundColor: AppConstants.terra,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ));
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.cream,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildTabBar(),
            Expanded(
              child: TabBarView(
                controller: _tab,
                children: [_buildFileTab(), _buildYouTubeTab()],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 14, 18, 4),
      child: Row(
        children: [
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Create Note',
                    style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                        color: AppConstants.text1)),
                Text('Upload file or YouTube link',
                    style: TextStyle(fontSize: 11, color: AppConstants.text2)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: AppConstants.sand,
        borderRadius: BorderRadius.circular(12),
      ),
      padding: const EdgeInsets.all(3),
      child: TabBar(
        controller: _tab,
        indicator: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(9),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withOpacity(0.06),
                blurRadius: 4,
                offset: const Offset(0, 1))
          ],
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        dividerColor: Colors.transparent,
        labelColor: AppConstants.terra,
        unselectedLabelColor: AppConstants.text2,
        labelStyle:
            const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        unselectedLabelStyle:
            const TextStyle(fontWeight: FontWeight.w400, fontSize: 13),
        tabs: const [
          Tab(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.upload_file_outlined, size: 15),
                SizedBox(width: 6),
                Text('Upload File'),
              ],
            ),
          ),
          Tab(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.play_circle_outline, size: 15),
                SizedBox(width: 6),
                Text('YouTube'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── File Tab ──────────────────────────────────────────────────────────────

  Widget _buildFileTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildDropZone(),
          const SizedBox(height: 16),
          _buildTitleField(hint: 'e.g. Physics Lecture 5'),
          const SizedBox(height: 12),
          _buildLanguagePicker(),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: (_filePath != null && !_processing) ? _processFile : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppConstants.terra,
                disabledBackgroundColor: AppConstants.warm,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              child: _processing
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : const Text('Process Recording',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w500)),
            ),
          ),
          const SizedBox(height: 12),
          Center(
            child: Text(
              'Supports: MP3, WAV, M4A, MP4, MOV · Max 100MB',
              style: const TextStyle(fontSize: 10, color: AppConstants.text3),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDropZone() {
    return GestureDetector(
      onTap: _processing ? null : _pickFile,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        width: double.infinity,
        height: 150,
        decoration: BoxDecoration(
          color: _filePath != null ? AppConstants.hotBg : AppConstants.sand,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: _filePath != null
                ? AppConstants.terra.withOpacity(0.4)
                : AppConstants.border,
            width: _filePath != null ? 1.5 : 1,
          ),
        ),
        child: _filePath != null ? _buildFilePreview() : _buildDropHint(),
      ),
    );
  }

  Widget _buildDropHint() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
              color: AppConstants.warm,
              borderRadius: BorderRadius.circular(14)),
          child: const Icon(Icons.upload_outlined,
              color: AppConstants.terra, size: 24),
        ),
        const SizedBox(height: 12),
        const Text('Tap to browse files',
            style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: AppConstants.text1)),
        const SizedBox(height: 4),
        const Text('MP3, WAV, M4A, MP4, MOV',
            style: TextStyle(fontSize: 11, color: AppConstants.text2)),
      ],
    );
  }

  Widget _buildFilePreview() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
            _isVideo
                ? Icons.videocam_outlined
                : Icons.audiotrack_outlined,
            color: AppConstants.terra,
            size: 36),
        const SizedBox(height: 10),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(_fileName!,
              style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: AppConstants.text1),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis),
        ),
        const SizedBox(height: 6),
        GestureDetector(
          onTap: () => setState(() { _filePath = null; _fileName = null; }),
          child: const Text('× Remove',
              style: TextStyle(fontSize: 11, color: AppConstants.text2)),
        ),
      ],
    );
  }

  // ── YouTube Tab ───────────────────────────────────────────────────────────

  Widget _buildYouTubeTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // YouTube URL input card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF0F0),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFFFCCCC)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFF0000).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.play_circle_filled,
                          color: Color(0xFFFF0000), size: 22),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('YouTube Video',
                              style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: AppConstants.text1)),
                          Text('Paste any YouTube link',
                              style: TextStyle(
                                  fontSize: 11, color: AppConstants.text2)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _ytCtrl,
                  onChanged: (v) {
                    if (v.length > 20) _fetchYtInfo(v);
                  },
                  style: const TextStyle(
                      fontSize: 13, color: AppConstants.text1),
                  decoration: InputDecoration(
                    hintText: 'https://www.youtube.com/watch?v=...',
                    hintStyle: const TextStyle(
                        color: AppConstants.text3, fontSize: 12),
                    prefixIcon: const Icon(Icons.link,
                        color: AppConstants.text3, size: 18),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide:
                            BorderSide(color: AppConstants.border)),
                    enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide:
                            BorderSide(color: AppConstants.border)),
                    focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                            color: Color(0xFFFF0000), width: 1.5)),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 12),
                  ),
                ),

                // Video preview
                if (_ytFetching) ...[
                  const SizedBox(height: 12),
                  const Row(
                    children: [
                      SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppConstants.text2),
                      ),
                      SizedBox(width: 8),
                      Text('Fetching video info...',
                          style: TextStyle(
                              fontSize: 12, color: AppConstants.text2)),
                    ],
                  ),
                ],
                if (_ytInfo != null && !_ytFetching) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppConstants.border),
                    ),
                    child: Row(
                      children: [
                        if (_ytInfo!['thumbnail'] != null)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              _ytInfo!['thumbnail'],
                              width: 64,
                              height: 48,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) =>
                                  const SizedBox(width: 64, height: 48),
                            ),
                          ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _ytInfo!['title'] ?? '',
                                style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: AppConstants.text1),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${_ytInfo!['channel'] ?? ''} · ${_fmtDuration(_ytInfo!['duration'])}',
                                style: const TextStyle(
                                    fontSize: 11,
                                    color: AppConstants.text2),
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.check_circle,
                            color: Colors.green, size: 18),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 10),
                const Row(
                  children: [
                    Icon(Icons.info_outline,
                        size: 12, color: AppConstants.text3),
                    SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        'Works with any public YouTube video. Processing time depends on video length.',
                        style: TextStyle(
                            fontSize: 10, color: AppConstants.text3),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),
          _buildTitleField(hint: 'Leave blank to use video title'),
          const SizedBox(height: 12),
          _buildLanguagePicker(),
          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: (_ytCtrl.text.trim().isNotEmpty && !_processing)
                  ? _processYouTube
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFCC0000),
                disabledBackgroundColor: AppConstants.warm,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              child: _processing
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.play_circle_outline,
                            color: Colors.white, size: 18),
                        SizedBox(width: 8),
                        Text('Get Notes from YouTube',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w500)),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Shared widgets ────────────────────────────────────────────────────────

  Widget _buildTitleField({required String hint}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('NOTE TITLE',
            style: TextStyle(
                fontSize: 10,
                color: AppConstants.text3,
                letterSpacing: 0.8,
                fontWeight: FontWeight.w500)),
        const SizedBox(height: 6),
        TextField(
          onChanged: (v) => _title = v,
          style: const TextStyle(fontSize: 13, color: AppConstants.text1),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle:
                const TextStyle(color: AppConstants.text3, fontSize: 13),
            filled: true,
            fillColor: AppConstants.sand,
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: AppConstants.border)),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: AppConstants.border)),
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide:
                    const BorderSide(color: AppConstants.terra, width: 1.5)),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          ),
        ),
      ],
    );
  }

  Widget _buildLanguagePicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('LANGUAGE',
            style: TextStyle(
                fontSize: 10,
                color: AppConstants.text3,
                letterSpacing: 0.8,
                fontWeight: FontWeight.w500)),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: AppConstants.sand,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppConstants.border),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _language,
              isExpanded: true,
              icon: const Icon(Icons.keyboard_arrow_down,
                  color: AppConstants.text2, size: 18),
              style: const TextStyle(
                  fontSize: 13, color: AppConstants.text1),
              items: AppConstants.supportedLanguages.entries
                  .map((e) =>
                      DropdownMenuItem(value: e.key, child: Text(e.value)))
                  .toList(),
              onChanged: (v) => setState(() => _language = v!),
            ),
          ),
        ),
      ],
    );
  }

  String _fmtDuration(dynamic secs) {
    if (secs == null) return '';
    final s = (secs as num).toInt();
    final m = s ~/ 60;
    final r = s % 60;
    return '${m}m ${r}s';
  }
}
