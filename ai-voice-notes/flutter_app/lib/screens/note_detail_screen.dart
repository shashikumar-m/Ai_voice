import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/note_model.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';

// ─── Tab enum ────────────────────────────────────────────────────────────────

enum _Tab { summary, transcript, flashcards, practice, mindMap, mockExam }

extension _TabLabel on _Tab {
  String get label {
    switch (this) {
      case _Tab.summary:    return 'Summary';
      case _Tab.transcript: return 'Transcript';
      case _Tab.flashcards: return 'Flashcards';
      case _Tab.practice:   return 'Practice Q';
      case _Tab.mindMap:    return 'Mind Map';
      case _Tab.mockExam:   return 'Mock Exam';
    }
  }

  IconData get icon {
    switch (this) {
      case _Tab.summary:    return Icons.article_outlined;
      case _Tab.transcript: return Icons.text_snippet_outlined;
      case _Tab.flashcards: return Icons.style_outlined;
      case _Tab.practice:   return Icons.quiz_outlined;
      case _Tab.mindMap:    return Icons.account_tree_outlined;
      case _Tab.mockExam:   return Icons.assignment_outlined;
    }
  }
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

class NoteDetailScreen extends StatefulWidget {
  final int noteId;
  const NoteDetailScreen({super.key, required this.noteId});

  @override
  State<NoteDetailScreen> createState() => _NoteDetailScreenState();
}

class _NoteDetailScreenState extends State<NoteDetailScreen> {
  Note? _note;
  bool _loadingNote = true;
  String? _noteError;
  _Tab _activeTab = _Tab.summary;

  // Per-tab loading & data
  bool _loadingFlashcards = false;
  bool _loadingPractice = false;
  bool _loadingMindMap = false;
  bool _loadingMockExam = false;

  List<Map<String, dynamic>> _flashcards = [];
  List<Map<String, dynamic>> _practiceQuestions = [];
  Map<String, dynamic>? _mindMap;
  Map<String, dynamic>? _mockExam;

  String? _flashcardsError;
  String? _practiceError;
  String? _mindMapError;
  String? _mockExamError;

  @override
  void initState() {
    super.initState();
    _loadNote();
  }

  Future<void> _loadNote() async {
    setState(() { _loadingNote = true; _noteError = null; });
    try {
      final note = await ApiService().getNoteById(widget.noteId);
      setState(() { _note = note; _loadingNote = false; });
    } catch (e) {
      setState(() { _noteError = e.toString(); _loadingNote = false; });
    }
  }

  Future<void> _loadTabData(_Tab tab) async {
    switch (tab) {
      case _Tab.flashcards:
        if (_flashcards.isNotEmpty || _loadingFlashcards) return;
        setState(() { _loadingFlashcards = true; _flashcardsError = null; });
        try {
          final data = await ApiService().getFlashcards(widget.noteId);
          setState(() { _flashcards = data; _loadingFlashcards = false; });
        } catch (e) {
          setState(() { _flashcardsError = e.toString(); _loadingFlashcards = false; });
        }
        break;
      case _Tab.practice:
        if (_practiceQuestions.isNotEmpty || _loadingPractice) return;
        setState(() { _loadingPractice = true; _practiceError = null; });
        try {
          final data = await ApiService().getPracticeQuestions(widget.noteId);
          setState(() { _practiceQuestions = data; _loadingPractice = false; });
        } catch (e) {
          setState(() { _practiceError = e.toString(); _loadingPractice = false; });
        }
        break;
      case _Tab.mindMap:
        if (_mindMap != null || _loadingMindMap) return;
        setState(() { _loadingMindMap = true; _mindMapError = null; });
        try {
          final data = await ApiService().getMindMap(widget.noteId);
          setState(() { _mindMap = data; _loadingMindMap = false; });
        } catch (e) {
          setState(() { _mindMapError = e.toString(); _loadingMindMap = false; });
        }
        break;
      case _Tab.mockExam:
        if (_mockExam != null || _loadingMockExam) return;
        setState(() { _loadingMockExam = true; _mockExamError = null; });
        try {
          final data = await ApiService().getMockExam(widget.noteId);
          setState(() { _mockExam = data; _loadingMockExam = false; });
        } catch (e) {
          setState(() { _mockExamError = e.toString(); _loadingMockExam = false; });
        }
        break;
      default:
        break;
    }
  }

  void _switchTab(_Tab tab) {
    setState(() => _activeTab = tab);
    _loadTabData(tab);
  }

  void _showExportSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _ExportSheet(note: _note!, noteId: widget.noteId),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.cream,
      body: SafeArea(
        child: _loadingNote
            ? _buildLoadingState()
            : _noteError != null
                ? _buildErrorState()
                : _buildContent(),
      ),
    );
  }

  Widget _buildLoadingState() {
    return Column(
      children: [
        _buildTopBar(title: 'Loading...', showExport: false),
        const Expanded(
          child: Center(
            child: CircularProgressIndicator(color: AppConstants.terra, strokeWidth: 2),
          ),
        ),
      ],
    );
  }

  Widget _buildErrorState() {
    return Column(
      children: [
        _buildTopBar(title: 'Error', showExport: false),
        Expanded(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: AppConstants.text3),
                const SizedBox(height: 12),
                const Text('Failed to load note', style: TextStyle(fontSize: 15, color: AppConstants.text2, fontWeight: FontWeight.w500)),
                const SizedBox(height: 6),
                Text(_noteError ?? '', style: const TextStyle(fontSize: 12, color: AppConstants.text3), textAlign: TextAlign.center),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _loadNote,
                  style: ElevatedButton.styleFrom(backgroundColor: AppConstants.terra, elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                  child: const Text('Retry', style: TextStyle(color: Colors.white, fontSize: 13)),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildContent() {
    final note = _note!;
    return Column(
      children: [
        _buildTopBar(title: note.title, showExport: true),
        _buildMeta(note),
        _buildKeywords(note),
        _buildTabBar(),
        Expanded(child: _buildTabContent()),
      ],
    );
  }

  // ── Top bar ────────────────────────────────────────────────────────────────

  Widget _buildTopBar({required String title, required bool showExport}) {
    return Container(
      padding: const EdgeInsets.fromLTRB(4, 8, 12, 8),
      decoration: const BoxDecoration(
        color: AppConstants.cream,
        border: Border(bottom: BorderSide(color: AppConstants.border)),
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, size: 18, color: AppConstants.text1),
            onPressed: () => Navigator.pop(context),
          ),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppConstants.text1),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (showExport)
            GestureDetector(
              onTap: _showExportSheet,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                decoration: BoxDecoration(
                  color: AppConstants.terra,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.ios_share_outlined, size: 14, color: Colors.white),
                    SizedBox(width: 5),
                    Text('Export', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Colors.white)),
                  ],
                ),
              ),
            ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms);
  }

  // ── Meta row ───────────────────────────────────────────────────────────────

  Widget _buildMeta(Note note) {
    final diff = DateTime.now().difference(note.createdAt).inDays;
    final dateStr = diff == 0 ? 'Today' : diff == 1 ? 'Yesterday' : '$diff days ago';
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
      child: Row(
        children: [
          Text(note.sourceIcon, style: const TextStyle(fontSize: 14)),
          const SizedBox(width: 6),
          Text(note.sourceType.toUpperCase(), style: const TextStyle(fontSize: 10, color: AppConstants.text3, letterSpacing: 0.6, fontWeight: FontWeight.w500)),
          const SizedBox(width: 10),
          const Icon(Icons.access_time, size: 12, color: AppConstants.text3),
          const SizedBox(width: 3),
          Text(note.formattedDuration, style: const TextStyle(fontSize: 11, color: AppConstants.text3)),
          const SizedBox(width: 10),
          const Icon(Icons.calendar_today_outlined, size: 12, color: AppConstants.text3),
          const SizedBox(width: 3),
          Text(dateStr, style: const TextStyle(fontSize: 11, color: AppConstants.text3)),
          const SizedBox(width: 10),
          const Icon(Icons.language_outlined, size: 12, color: AppConstants.text3),
          const SizedBox(width: 3),
          Text(note.language.toUpperCase(), style: const TextStyle(fontSize: 11, color: AppConstants.text3)),
        ],
      ),
    ).animate().fadeIn(delay: 80.ms, duration: 300.ms);
  }

  // ── Keywords ───────────────────────────────────────────────────────────────

  Widget _buildKeywords(Note note) {
    if (note.keywords.isEmpty) return const SizedBox.shrink();
    final chipStyles = [
      (AppConstants.hotBg, AppConstants.hotText),
      (AppConstants.warmBg, AppConstants.warmText),
      (AppConstants.coolBg, AppConstants.coolText),
    ];
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      child: Wrap(
        spacing: 6,
        runSpacing: 6,
        children: note.keywords.asMap().entries.map((e) {
          final style = chipStyles[e.key % chipStyles.length];
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: style.$1,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(e.value, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: style.$2)),
          );
        }).toList(),
      ),
    ).animate().fadeIn(delay: 120.ms, duration: 300.ms);
  }

  // ── Tab bar ────────────────────────────────────────────────────────────────

  Widget _buildTabBar() {
    return Container(
      height: 44,
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppConstants.border)),
      ),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        children: _Tab.values.map((tab) {
          final active = _activeTab == tab;
          return GestureDetector(
            onTap: () => _switchTab(tab),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
              decoration: BoxDecoration(
                color: active ? AppConstants.terra : AppConstants.sand,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: active ? AppConstants.terra : AppConstants.border),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(tab.icon, size: 13, color: active ? Colors.white : AppConstants.text2),
                  const SizedBox(width: 5),
                  Text(tab.label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: active ? Colors.white : AppConstants.text2)),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // ── Tab content dispatcher ─────────────────────────────────────────────────

  Widget _buildTabContent() {
    switch (_activeTab) {
      case _Tab.summary:    return _SummaryTab(note: _note!);
      case _Tab.transcript: return _TranscriptTab(note: _note!);
      case _Tab.flashcards: return _FlashcardsTab(loading: _loadingFlashcards, error: _flashcardsError, cards: _flashcards, onRetry: () => _loadTabData(_Tab.flashcards));
      case _Tab.practice:   return _PracticeTab(loading: _loadingPractice, error: _practiceError, questions: _practiceQuestions, onRetry: () => _loadTabData(_Tab.practice));
      case _Tab.mindMap:    return _MindMapTab(loading: _loadingMindMap, error: _mindMapError, data: _mindMap, onRetry: () => _loadTabData(_Tab.mindMap));
      case _Tab.mockExam:   return _MockExamTab(loading: _loadingMockExam, error: _mockExamError, data: _mockExam, onRetry: () => _loadTabData(_Tab.mockExam));
    }
  }
}

// ─── Summary Tab ──────────────────────────────────────────────────────────────

class _SummaryTab extends StatelessWidget {
  final Note note;
  const _SummaryTab({required this.note});

  @override
  Widget build(BuildContext context) {
    final summary = note.summary;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: summary == null || summary.isEmpty
          ? const _EmptyTabState(
              icon: Icons.article_outlined,
              message: 'No summary available',
              sub: 'Summary will appear here once generated',
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const _SectionHeader(icon: Icons.article_outlined, label: 'Summary'),
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppConstants.sand,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppConstants.border),
                  ),
                  child: Text(
                    summary,
                    style: const TextStyle(fontSize: 13, color: AppConstants.text1, height: 1.7),
                  ),
                ),
              ],
            ),
    ).animate().fadeIn(duration: 300.ms);
  }
}

// ─── Transcript Tab ───────────────────────────────────────────────────────────

class _TranscriptTab extends StatelessWidget {
  final Note note;
  const _TranscriptTab({required this.note});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SectionHeader(icon: Icons.text_snippet_outlined, label: 'Full Transcript'),
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppConstants.sand,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppConstants.border),
            ),
            child: Text(
              note.transcript,
              style: const TextStyle(fontSize: 13, color: AppConstants.text1, height: 1.75),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms);
  }
}

// ─── Flashcards Tab ───────────────────────────────────────────────────────────

class _FlashcardsTab extends StatefulWidget {
  final bool loading;
  final String? error;
  final List<Map<String, dynamic>> cards;
  final VoidCallback onRetry;

  const _FlashcardsTab({required this.loading, this.error, required this.cards, required this.onRetry});

  @override
  State<_FlashcardsTab> createState() => _FlashcardsTabState();
}

class _FlashcardsTabState extends State<_FlashcardsTab> with SingleTickerProviderStateMixin {
  int _index = 0;
  bool _flipped = false;
  late AnimationController _flipCtrl;
  late Animation<double> _flipAnim;

  @override
  void initState() {
    super.initState();
    _flipCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 400));
    _flipAnim = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(parent: _flipCtrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _flipCtrl.dispose();
    super.dispose();
  }

  void _flip() {
    if (_flipped) {
      _flipCtrl.reverse();
    } else {
      _flipCtrl.forward();
    }
    setState(() => _flipped = !_flipped);
  }

  void _prev() {
    if (_index > 0) {
      setState(() { _index--; _flipped = false; });
      _flipCtrl.reset();
    }
  }

  void _next() {
    if (_index < widget.cards.length - 1) {
      setState(() { _index++; _flipped = false; });
      _flipCtrl.reset();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.loading) return const _TabLoadingState(message: 'Generating flashcards...');
    if (widget.error != null) return _TabErrorState(error: widget.error!, onRetry: widget.onRetry);
    if (widget.cards.isEmpty) return const _EmptyTabState(icon: Icons.style_outlined, message: 'No flashcards yet', sub: 'Tap the tab to generate flashcards');

    final card = widget.cards[_index];
    final front = card['front']?.toString() ?? '';
    final back = card['back']?.toString() ?? '';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const _SectionHeader(icon: Icons.style_outlined, label: 'Flashcards'),
          const SizedBox(height: 6),
          Text('${_index + 1} / ${widget.cards.length}', style: const TextStyle(fontSize: 12, color: AppConstants.text3)),
          const SizedBox(height: 14),
          GestureDetector(
            onTap: _flip,
            child: AnimatedBuilder(
              animation: _flipAnim,
              builder: (_, __) {
                final angle = _flipAnim.value * 3.14159;
                final showBack = _flipAnim.value > 0.5;
                return Transform(
                  alignment: Alignment.center,
                  transform: Matrix4.identity()
                    ..setEntry(3, 2, 0.001)
                    ..rotateY(angle),
                  child: Container(
                    width: double.infinity,
                    constraints: const BoxConstraints(minHeight: 200),
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: showBack ? AppConstants.terra : AppConstants.sand,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: showBack ? AppConstants.terra : AppConstants.border),
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 12, offset: const Offset(0, 4))],
                    ),
                    child: Transform(
                      alignment: Alignment.center,
                      transform: Matrix4.identity()..rotateY(showBack ? 3.14159 : 0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            showBack ? 'ANSWER' : 'QUESTION',
                            style: TextStyle(fontSize: 10, letterSpacing: 1.2, fontWeight: FontWeight.w600, color: showBack ? Colors.white.withValues(alpha: 0.7) : AppConstants.text3),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            showBack ? back : front,
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: showBack ? Colors.white : AppConstants.text1, height: 1.5),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            showBack ? 'Tap to see question' : 'Tap to reveal answer',
                            style: TextStyle(fontSize: 11, color: showBack ? Colors.white.withValues(alpha: 0.6) : AppConstants.text3),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _NavButton(icon: Icons.arrow_back_ios_new, label: 'Previous', onTap: _index > 0 ? _prev : null),
              const SizedBox(width: 16),
              _NavButton(icon: Icons.arrow_forward_ios, label: 'Next', onTap: _index < widget.cards.length - 1 ? _next : null, iconAfter: true),
            ],
          ),
          const SizedBox(height: 12),
          LinearProgressIndicator(
            value: ((_index + 1) / widget.cards.length),
            backgroundColor: AppConstants.border,
            color: AppConstants.terra,
            borderRadius: BorderRadius.circular(4),
            minHeight: 4,
          ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms);
  }
}

// ─── Practice Questions Tab ───────────────────────────────────────────────────

class _PracticeTab extends StatefulWidget {
  final bool loading;
  final String? error;
  final List<Map<String, dynamic>> questions;
  final VoidCallback onRetry;

  const _PracticeTab({required this.loading, this.error, required this.questions, required this.onRetry});

  @override
  State<_PracticeTab> createState() => _PracticeTabState();
}

class _PracticeTabState extends State<_PracticeTab> {
  final Map<int, String> _selected = {};
  final Set<int> _revealed = {};

  @override
  Widget build(BuildContext context) {
    if (widget.loading) return const _TabLoadingState(message: 'Generating practice questions...');
    if (widget.error != null) return _TabErrorState(error: widget.error!, onRetry: widget.onRetry);
    if (widget.questions.isEmpty) return const _EmptyTabState(icon: Icons.quiz_outlined, message: 'No questions yet', sub: 'Tap the tab to generate practice questions');

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: widget.questions.length + 1,
      itemBuilder: (ctx, i) {
        if (i == 0) return Padding(padding: const EdgeInsets.only(bottom: 12), child: _SectionHeader(icon: Icons.quiz_outlined, label: 'Practice Questions (${widget.questions.length})'));
        final qi = i - 1;
        final q = widget.questions[qi];
        final question = q['question']?.toString() ?? '';
        final options = (q['options'] as List?)?.map((e) => e.toString()).toList() ?? [];
        final answer = q['answer']?.toString() ?? '';
        final explanation = q['explanation']?.toString() ?? '';
        final selected = _selected[qi];
        final revealed = _revealed.contains(qi);

        return Container(
          margin: const EdgeInsets.only(bottom: 14),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppConstants.sand,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppConstants.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 24, height: 24,
                    decoration: const BoxDecoration(color: AppConstants.terra, shape: BoxShape.circle),
                    child: Center(child: Text('${qi + 1}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white))),
                  ),
                  const SizedBox(width: 10),
                  Expanded(child: Text(question, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppConstants.text1, height: 1.5))),
                ],
              ),
              const SizedBox(height: 12),
              ...options.asMap().entries.map((e) {
                final letter = String.fromCharCode(65 + e.key); // A, B, C, D
                final isSelected = selected == letter;
                final isCorrect = letter == answer;
                Color bg = AppConstants.cream;
                Color borderColor = AppConstants.border;
                Color textColor = AppConstants.text1;
                if (revealed) {
                  if (isCorrect) { bg = AppConstants.coolBg; borderColor = AppConstants.coolText; textColor = AppConstants.coolText; }
                  else if (isSelected && !isCorrect) { bg = AppConstants.hotBg; borderColor = AppConstants.hotText; textColor = AppConstants.hotText; }
                } else if (isSelected) {
                  bg = AppConstants.warmBg; borderColor = AppConstants.amber; textColor = AppConstants.warmText;
                }
                return GestureDetector(
                  onTap: revealed ? null : () => setState(() => _selected[qi] = letter),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.only(bottom: 7),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(10), border: Border.all(color: borderColor)),
                    child: Row(
                      children: [
                        Container(
                          width: 22, height: 22,
                          decoration: BoxDecoration(
                            color: isSelected || (revealed && isCorrect) ? borderColor : Colors.transparent,
                            shape: BoxShape.circle,
                            border: Border.all(color: borderColor),
                          ),
                          child: Center(child: Text(letter, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: isSelected || (revealed && isCorrect) ? Colors.white : textColor))),
                        ),
                        const SizedBox(width: 10),
                        Expanded(child: Text(e.value, style: TextStyle(fontSize: 12, color: textColor, height: 1.4))),
                        if (revealed && isCorrect) const Icon(Icons.check_circle, size: 16, color: AppConstants.coolText),
                        if (revealed && isSelected && !isCorrect) const Icon(Icons.cancel, size: 16, color: AppConstants.hotText),
                      ],
                    ),
                  ),
                );
              }),
              const SizedBox(height: 8),
              if (!revealed)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: selected != null ? () => setState(() => _revealed.add(qi)) : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppConstants.terra,
                      disabledBackgroundColor: AppConstants.border,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    child: Text('Check Answer', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: selected != null ? Colors.white : AppConstants.text3)),
                  ),
                ),
              if (revealed && explanation.isNotEmpty) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: AppConstants.coolBg, borderRadius: BorderRadius.circular(10)),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.lightbulb_outline, size: 14, color: AppConstants.coolText),
                      const SizedBox(width: 8),
                      Expanded(child: Text(explanation, style: const TextStyle(fontSize: 12, color: AppConstants.coolText, height: 1.5))),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ).animate().fadeIn(delay: (qi * 50).ms, duration: 300.ms);
      },
    );
  }
}

// ─── Mind Map Tab ─────────────────────────────────────────────────────────────

class _MindMapTab extends StatelessWidget {
  final bool loading;
  final String? error;
  final Map<String, dynamic>? data;
  final VoidCallback onRetry;

  const _MindMapTab({required this.loading, this.error, this.data, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    if (loading) return const _TabLoadingState(message: 'Generating mind map...');
    if (error != null) return _TabErrorState(error: error!, onRetry: onRetry);
    if (data == null) return const _EmptyTabState(icon: Icons.account_tree_outlined, message: 'No mind map yet', sub: 'Tap the tab to generate a mind map');

    final center = data!['center']?.toString() ?? 'Main Topic';
    final branches = (data!['branches'] as List?) ?? [];

    final branchColors = [
      (AppConstants.hotBg, AppConstants.hotText),
      (AppConstants.warmBg, AppConstants.warmText),
      (AppConstants.coolBg, AppConstants.coolText),
      (const Color(0xFFEEE8FF), const Color(0xFF6050A0)),
      (const Color(0xFFFFEEF8), const Color(0xFFA04080)),
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SectionHeader(icon: Icons.account_tree_outlined, label: 'Mind Map'),
          const SizedBox(height: 16),
          // Center node
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              decoration: BoxDecoration(
                color: AppConstants.text1,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              child: Text(center, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white), textAlign: TextAlign.center),
            ),
          ),
          const SizedBox(height: 8),
          // Connector line
          Center(child: Container(width: 2, height: 20, color: AppConstants.border)),
          const SizedBox(height: 4),
          // Branches
          ...branches.asMap().entries.map((e) {
            final branch = e.value as Map<String, dynamic>;
            final topic = branch['topic']?.toString() ?? '';
            final subtopics = (branch['subtopics'] as List?)?.map((s) => s.toString()).toList() ?? [];
            final colorPair = branchColors[e.key % branchColors.length];

            return Column(
              children: [
                Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: colorPair.$1,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: colorPair.$2.withValues(alpha: 0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(width: 8, height: 8, decoration: BoxDecoration(color: colorPair.$2, shape: BoxShape.circle)),
                          const SizedBox(width: 8),
                          Expanded(child: Text(topic, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: colorPair.$2))),
                        ],
                      ),
                      if (subtopics.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        ...subtopics.map((sub) => Padding(
                          padding: const EdgeInsets.only(left: 16, bottom: 5),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsets.only(top: 5),
                                child: Container(width: 4, height: 4, decoration: BoxDecoration(color: colorPair.$2.withValues(alpha: 0.6), shape: BoxShape.circle)),
                              ),
                              const SizedBox(width: 8),
                              Expanded(child: Text(sub, style: TextStyle(fontSize: 12, color: colorPair.$2.withValues(alpha: 0.85), height: 1.4))),
                            ],
                          ),
                        )),
                      ],
                    ],
                  ),
                ),
              ],
            ).animate().fadeIn(delay: (e.key * 80).ms, duration: 300.ms);
          }),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms);
  }
}

// ─── Mock Exam Tab ────────────────────────────────────────────────────────────

class _MockExamTab extends StatefulWidget {
  final bool loading;
  final String? error;
  final Map<String, dynamic>? data;
  final VoidCallback onRetry;

  const _MockExamTab({required this.loading, this.error, this.data, required this.onRetry});

  @override
  State<_MockExamTab> createState() => _MockExamTabState();
}

class _MockExamTabState extends State<_MockExamTab> {
  final Map<int, String> _answers = {};
  bool _submitted = false;
  int _score = 0;
  int _total = 0;

  void _submit(List questions) {
    int score = 0;
    for (int i = 0; i < questions.length; i++) {
      final q = questions[i] as Map<String, dynamic>;
      final correct = q['answer']?.toString() ?? '';
      if (_answers[i] == correct) score++;
    }
    setState(() { _submitted = true; _score = score; _total = questions.length; });
  }

  Color _difficultyColor(String? diff) {
    switch (diff?.toLowerCase()) {
      case 'easy':   return AppConstants.coolText;
      case 'medium': return AppConstants.warmText;
      case 'hard':   return AppConstants.hotText;
      default:       return AppConstants.text3;
    }
  }

  Color _difficultyBg(String? diff) {
    switch (diff?.toLowerCase()) {
      case 'easy':   return AppConstants.coolBg;
      case 'medium': return AppConstants.warmBg;
      case 'hard':   return AppConstants.hotBg;
      default:       return AppConstants.border;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.loading) return const _TabLoadingState(message: 'Generating mock exam...');
    if (widget.error != null) return _TabErrorState(error: widget.error!, onRetry: widget.onRetry);
    if (widget.data == null) return const _EmptyTabState(icon: Icons.assignment_outlined, message: 'No exam yet', sub: 'Tap the tab to generate a mock exam');

    final questions = (widget.data!['questions'] as List?) ?? [];
    final totalMarks = widget.data!['total_marks'] ?? questions.length;
    final duration = widget.data!['duration_minutes'] ?? 30;

    return Column(
      children: [
        // Exam header
        Container(
          margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppConstants.sand,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppConstants.border),
          ),
          child: Row(
            children: [
              const Icon(Icons.assignment_outlined, size: 20, color: AppConstants.terra),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Mock Exam', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppConstants.text1)),
                    Text('${questions.length} questions · $totalMarks marks · $duration min', style: const TextStyle(fontSize: 11, color: AppConstants.text2)),
                  ],
                ),
              ),
              if (_submitted)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: _score >= (_total * 0.7) ? AppConstants.coolBg : AppConstants.hotBg,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '$_score/$_total',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: _score >= (_total * 0.7) ? AppConstants.coolText : AppConstants.hotText),
                  ),
                ),
            ],
          ),
        ),
        if (_submitted) ...[
          Container(
            margin: const EdgeInsets.fromLTRB(16, 10, 16, 0),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: _score >= (_total * 0.7) ? AppConstants.coolBg : AppConstants.hotBg,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                Icon(_score >= (_total * 0.7) ? Icons.emoji_events_outlined : Icons.sentiment_neutral_outlined,
                    size: 28, color: _score >= (_total * 0.7) ? AppConstants.coolText : AppConstants.hotText),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _score >= (_total * 0.7) ? 'Great job!' : 'Keep practicing!',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: _score >= (_total * 0.7) ? AppConstants.coolText : AppConstants.hotText),
                      ),
                      Text(
                        'You scored $_score out of $_total (${((_score / _total) * 100).round()}%)',
                        style: TextStyle(fontSize: 12, color: _score >= (_total * 0.7) ? AppConstants.coolText : AppConstants.hotText),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
            itemCount: questions.length,
            itemBuilder: (ctx, qi) {
              final q = questions[qi] as Map<String, dynamic>;
              final question = q['question']?.toString() ?? '';
              final options = (q['options'] as List?)?.map((e) => e.toString()).toList() ?? [];
              final answer = q['answer']?.toString() ?? '';
              final difficulty = q['difficulty']?.toString();
              final marks = q['marks'] ?? 1;
              final selected = _answers[qi];

              return Container(
                margin: const EdgeInsets.only(bottom: 14),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppConstants.sand,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppConstants.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 24, height: 24,
                          decoration: const BoxDecoration(color: AppConstants.terra, shape: BoxShape.circle),
                          child: Center(child: Text('${qi + 1}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white))),
                        ),
                        const SizedBox(width: 8),
                        Expanded(child: Text(question, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppConstants.text1, height: 1.4))),
                        const SizedBox(width: 8),
                        if (difficulty != null)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                            decoration: BoxDecoration(color: _difficultyBg(difficulty), borderRadius: BorderRadius.circular(6)),
                            child: Text(difficulty, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w500, color: _difficultyColor(difficulty))),
                          ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(color: AppConstants.warmBg, borderRadius: BorderRadius.circular(6)),
                          child: Text('$marks mk', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w500, color: AppConstants.warmText)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ...options.asMap().entries.map((e) {
                      final letter = String.fromCharCode(65 + e.key);
                      final isSelected = selected == letter;
                      final isCorrect = letter == answer;
                      Color bg = AppConstants.cream;
                      Color borderColor = AppConstants.border;
                      Color textColor = AppConstants.text1;
                      if (_submitted) {
                        if (isCorrect) { bg = AppConstants.coolBg; borderColor = AppConstants.coolText; textColor = AppConstants.coolText; }
                        else if (isSelected && !isCorrect) { bg = AppConstants.hotBg; borderColor = AppConstants.hotText; textColor = AppConstants.hotText; }
                      } else if (isSelected) {
                        bg = AppConstants.warmBg; borderColor = AppConstants.amber; textColor = AppConstants.warmText;
                      }
                      return GestureDetector(
                        onTap: _submitted ? null : () => setState(() => _answers[qi] = letter),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          margin: const EdgeInsets.only(bottom: 7),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                          decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(10), border: Border.all(color: borderColor)),
                          child: Row(
                            children: [
                              Container(
                                width: 20, height: 20,
                                decoration: BoxDecoration(
                                  color: isSelected || (_submitted && isCorrect) ? borderColor : Colors.transparent,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: borderColor),
                                ),
                                child: Center(child: Text(letter, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: isSelected || (_submitted && isCorrect) ? Colors.white : textColor))),
                              ),
                              const SizedBox(width: 10),
                              Expanded(child: Text(e.value, style: TextStyle(fontSize: 12, color: textColor, height: 1.4))),
                              if (_submitted && isCorrect) const Icon(Icons.check_circle, size: 14, color: AppConstants.coolText),
                              if (_submitted && isSelected && !isCorrect) const Icon(Icons.cancel, size: 14, color: AppConstants.hotText),
                            ],
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              ).animate().fadeIn(delay: (qi * 40).ms, duration: 300.ms);
            },
          ),
        ),
        if (!_submitted)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _answers.length == questions.length ? () => _submit(questions) : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConstants.terra,
                  disabledBackgroundColor: AppConstants.border,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: Text(
                  _answers.length == questions.length ? 'Submit Exam' : 'Answer all questions (${_answers.length}/${questions.length})',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: _answers.length == questions.length ? Colors.white : AppConstants.text3),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

// ─── Export Bottom Sheet ──────────────────────────────────────────────────────

class _ExportSheet extends StatelessWidget {
  final Note note;
  final int noteId;

  const _ExportSheet({required this.note, required this.noteId});

  Future<void> _downloadPdf(BuildContext context) async {
    final url = ApiService().getPdfExportUrl(noteId);
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open PDF'), backgroundColor: AppConstants.terra),
        );
      }
    }
  }

  Future<void> _shareNote(BuildContext context) async {
    final text = '${note.title}\n\n${note.summary ?? note.transcript}';
    await Share.share(text, subject: note.title);
  }

  Future<void> _copySummary(BuildContext context) async {
    final summary = note.summary ?? '';
    if (summary.isEmpty) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No summary available'), backgroundColor: AppConstants.terra));
      return;
    }
    await Clipboard.setData(ClipboardData(text: summary));
    if (context.mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Summary copied!'), backgroundColor: AppConstants.terra));
    }
  }

  Future<void> _copyTranscript(BuildContext context) async {
    await Clipboard.setData(ClipboardData(text: note.transcript));
    if (context.mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Transcript copied!'), backgroundColor: AppConstants.terra));
    }
  }

  Future<void> _copyKeywords(BuildContext context) async {
    final text = note.keywords.join(', ');
    if (text.isEmpty) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No keywords available'), backgroundColor: AppConstants.terra));
      return;
    }
    await Clipboard.setData(ClipboardData(text: text));
    if (context.mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Keywords copied!'), backgroundColor: AppConstants.terra));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppConstants.cream,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 10),
          Container(width: 36, height: 4, decoration: BoxDecoration(color: AppConstants.border, borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Export & Share', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppConstants.text1)),
                      Text('Choose an export option', style: TextStyle(fontSize: 12, color: AppConstants.text2)),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    width: 30, height: 30,
                    decoration: BoxDecoration(color: AppConstants.sand, shape: BoxShape.circle, border: Border.all(color: AppConstants.border)),
                    child: const Icon(Icons.close, size: 16, color: AppConstants.text2),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Divider(color: AppConstants.border, height: 1),
          const SizedBox(height: 8),
          _SheetOption(
            icon: Icons.picture_as_pdf_outlined,
            iconColor: AppConstants.hotText,
            iconBg: AppConstants.hotBg,
            title: 'Download PDF',
            subtitle: 'Save formatted note as PDF',
            onTap: () => _downloadPdf(context),
          ),
          _SheetOption(
            icon: Icons.share_outlined,
            iconColor: AppConstants.coolText,
            iconBg: AppConstants.coolBg,
            title: 'Share Note',
            subtitle: 'Share summary via apps',
            onTap: () => _shareNote(context),
          ),
          _SheetOption(
            icon: Icons.content_copy_outlined,
            iconColor: AppConstants.warmText,
            iconBg: AppConstants.warmBg,
            title: 'Copy Summary',
            subtitle: 'Copy summary to clipboard',
            onTap: () => _copySummary(context),
          ),
          _SheetOption(
            icon: Icons.text_fields_outlined,
            iconColor: AppConstants.terra,
            iconBg: AppConstants.hotBg,
            title: 'Copy Transcript',
            subtitle: 'Copy full transcript to clipboard',
            onTap: () => _copyTranscript(context),
          ),
          _SheetOption(
            icon: Icons.label_outline,
            iconColor: const Color(0xFF6050A0),
            iconBg: const Color(0xFFEEE8FF),
            title: 'Copy Keywords',
            subtitle: 'Copy all keywords to clipboard',
            onTap: () => _copyKeywords(context),
          ),
          SizedBox(height: MediaQuery.of(context).padding.bottom + 16),
        ],
      ),
    ).animate().slideY(begin: 0.2, duration: 300.ms, curve: Curves.easeOut);
  }
}

class _SheetOption extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _SheetOption({required this.icon, required this.iconColor, required this.iconBg, required this.title, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 42, height: 42,
              decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, size: 20, color: iconColor),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppConstants.text1)),
                  Text(subtitle, style: const TextStyle(fontSize: 11, color: AppConstants.text2)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, size: 18, color: AppConstants.text3),
          ],
        ),
      ),
    );
  }
}

// ─── Shared Helper Widgets ────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final String label;

  const _SectionHeader({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppConstants.terra),
        const SizedBox(width: 7),
        Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppConstants.text1, letterSpacing: 0.2)),
      ],
    );
  }
}

class _TabLoadingState extends StatelessWidget {
  final String message;
  const _TabLoadingState({required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(color: AppConstants.terra, strokeWidth: 2),
          const SizedBox(height: 16),
          Text(message, style: const TextStyle(fontSize: 13, color: AppConstants.text2)),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms);
  }
}

class _TabErrorState extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;

  const _TabErrorState({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 40, color: AppConstants.text3),
            const SizedBox(height: 12),
            const Text('Failed to load', style: TextStyle(fontSize: 14, color: AppConstants.text2, fontWeight: FontWeight.w500)),
            const SizedBox(height: 6),
            Text(error, style: const TextStyle(fontSize: 11, color: AppConstants.text3), textAlign: TextAlign.center, maxLines: 3, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: onRetry,
              style: ElevatedButton.styleFrom(backgroundColor: AppConstants.terra, elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
              child: const Text('Retry', style: TextStyle(color: Colors.white, fontSize: 13)),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 300.ms);
  }
}

class _EmptyTabState extends StatelessWidget {
  final IconData icon;
  final String message;
  final String sub;

  const _EmptyTabState({required this.icon, required this.message, required this.sub});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 44, color: AppConstants.text3),
          const SizedBox(height: 12),
          Text(message, style: const TextStyle(fontSize: 14, color: AppConstants.text2, fontWeight: FontWeight.w500)),
          const SizedBox(height: 6),
          Text(sub, style: const TextStyle(fontSize: 12, color: AppConstants.text3), textAlign: TextAlign.center),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms);
  }
}

class _NavButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final bool iconAfter;

  const _NavButton({required this.icon, required this.label, this.onTap, this.iconAfter = false});

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedOpacity(
        opacity: enabled ? 1.0 : 0.35,
        duration: const Duration(milliseconds: 200),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: enabled ? AppConstants.sand : AppConstants.border,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppConstants.border),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: iconAfter
                ? [Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppConstants.text1)), const SizedBox(width: 6), Icon(icon, size: 14, color: AppConstants.text2)]
                : [Icon(icon, size: 14, color: AppConstants.text2), const SizedBox(width: 6), Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppConstants.text1))],
          ),
        ),
      ),
    );
  }
}
