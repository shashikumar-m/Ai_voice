import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../models/note_model.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../utils/constants.dart';
import 'note_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Note> _recent = [];
  bool _loading = true;
  final _auth = AuthService();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final notes = await ApiService().getNotes(limit: 5);
      setState(() { _recent = notes; _loading = false; });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  String get _greeting {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.cream,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          color: AppConstants.terra,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildHeroBanner(),
                      const SizedBox(height: 16),
                      _buildStatsRow(),
                      const SizedBox(height: 24),
                      _buildRecentSection(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final user = _auth.user;
    final isGuest = _auth.isGuest;
    final initial = isGuest ? 'G' : (user?.name.isNotEmpty == true ? user!.name[0].toUpperCase() : 'U');

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_greeting,
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppConstants.text1)),
                const SizedBox(height: 2),
                Text(
                  isGuest ? 'Guest Mode' : (user?.email ?? ''),
                  style: const TextStyle(fontSize: 13, color: AppConstants.text2),
                ),
              ],
            ),
          ),
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppConstants.gradStart, AppConstants.gradEnd],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
              boxShadow: [BoxShadow(color: AppConstants.terra.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 2))],
            ),
            child: Center(
              child: Text(initial, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white)),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms);
  }

  Widget _buildHeroBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppConstants.gradStart, AppConstants.gradEnd],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: AppConstants.terra.withOpacity(0.25), blurRadius: 16, offset: const Offset(0, 6)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.auto_awesome, size: 12, color: Colors.white),
                SizedBox(width: 5),
                Text('AI-Powered', style: TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const Text('Turn Voice Into\nSmart Notes',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white, height: 1.2)),
          const SizedBox(height: 8),
          Text('Upload audio, video or YouTube links\nand get AI-powered notes instantly.',
              style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.8), height: 1.5)),
          const SizedBox(height: 16),
          Row(
            children: [
              _HeroChip(icon: Icons.mic_outlined, label: 'Audio'),
              const SizedBox(width: 8),
              _HeroChip(icon: Icons.videocam_outlined, label: 'Video'),
              const SizedBox(width: 8),
              _HeroChip(icon: Icons.play_circle_outline, label: 'YouTube'),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(delay: 100.ms, duration: 400.ms).slideY(begin: 0.1);
  }

  Widget _buildStatsRow() {
    return Row(
      children: [
        Expanded(child: _StatCard(
          icon: Icons.notes_outlined,
          value: '${_recent.length}',
          label: 'Recent Notes',
          color: AppConstants.terra,
          bg: AppConstants.hotBg,
        )),
        const SizedBox(width: 10),
        Expanded(child: _StatCard(
          icon: Icons.language_outlined,
          value: '19',
          label: 'Languages',
          color: AppConstants.amber,
          bg: AppConstants.warmBg,
        )),
        const SizedBox(width: 10),
        Expanded(child: _StatCard(
          icon: Icons.bolt_outlined,
          value: 'Fast',
          label: 'Processing',
          color: AppConstants.success,
          bg: AppConstants.coolBg,
        )),
      ],
    ).animate().fadeIn(delay: 150.ms, duration: 400.ms);
  }

  Widget _buildRecentSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text('Recent Notes',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppConstants.text1)),
            const Spacer(),
            GestureDetector(
              onTap: _load,
              child: const Text('Refresh', style: TextStyle(fontSize: 12, color: AppConstants.terra, fontWeight: FontWeight.w500)),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (_loading)
          ...List.generate(3, (_) => Container(
            height: 72, margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppConstants.border),
            ),
          ))
        else if (_recent.isEmpty)
          _buildEmpty()
        else
          ..._recent.asMap().entries.map((e) => _RecentCard(
            note: e.value,
            onTap: () => Navigator.push(context, MaterialPageRoute(
              builder: (_) => NoteDetailScreen(noteId: e.value.id),
            )).then((_) => _load()),
          ).animate().fadeIn(delay: (e.key * 60).ms, duration: 300.ms)),
      ],
    );
  }

  Widget _buildEmpty() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppConstants.border),
      ),
      child: Column(
        children: [
          Container(
            width: 56, height: 56,
            decoration: BoxDecoration(color: AppConstants.hotBg, borderRadius: BorderRadius.circular(16)),
            child: const Icon(Icons.notes_outlined, size: 28, color: AppConstants.terra),
          ),
          const SizedBox(height: 12),
          const Text('No notes yet', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppConstants.text1)),
          const SizedBox(height: 4),
          const Text('Upload a recording to get started', style: TextStyle(fontSize: 12, color: AppConstants.text2), textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

class _HeroChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _HeroChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: Colors.white),
          const SizedBox(width: 5),
          Text(label, style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;
  final Color bg;
  const _StatCard({required this.icon, required this.value, required this.label, required this.color, required this.bg});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppConstants.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, size: 16, color: color),
          ),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppConstants.text1)),
          Text(label, style: const TextStyle(fontSize: 10, color: AppConstants.text2)),
        ],
      ),
    );
  }
}

class _RecentCard extends StatelessWidget {
  final Note note;
  final VoidCallback onTap;
  const _RecentCard({required this.note, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final diff = DateTime.now().difference(note.createdAt).inDays;
    final date = diff == 0 ? 'Today' : diff == 1 ? 'Yesterday' : '$diff days ago';
    final duration = note.duration != null ? '${(note.duration! / 60).floor()} min' : '';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppConstants.border),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 6, offset: const Offset(0, 2))],
        ),
        child: Row(
          children: [
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(color: AppConstants.hotBg, borderRadius: BorderRadius.circular(10)),
              child: Center(child: Text(note.sourceIcon, style: const TextStyle(fontSize: 18))),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(note.title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppConstants.text1), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 3),
                  Text('$date${duration.isNotEmpty ? ' · $duration' : ''}', style: const TextStyle(fontSize: 11, color: AppConstants.text2)),
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
