import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../models/note_model.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';
import 'note_detail_screen.dart';

class NotesScreen extends StatefulWidget {
  const NotesScreen({super.key});

  @override
  State<NotesScreen> createState() => _NotesScreenState();
}

class _NotesScreenState extends State<NotesScreen> {
  List<Note> _notes = [];
  bool _loading = true;
  String _search = '';
  String _filter = '';
  final _ctrl = TextEditingController();

  @override
  void initState() { super.initState(); _load(); }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final notes = await ApiService().getNotes(search: _search, sourceType: _filter, limit: 50);
      setState(() { _notes = notes; _loading = false; });
    } catch (_) { setState(() => _loading = false); }
  }

  Future<void> _delete(Note note) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppConstants.cream,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete Note?', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: AppConstants.text1)),
        content: Text('Delete "${note.title}"?', style: const TextStyle(fontSize: 13, color: AppConstants.text2)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel', style: TextStyle(color: AppConstants.text2))),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppConstants.terra, elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            child: const Text('Delete', style: TextStyle(color: Colors.white, fontSize: 13))),
        ],
      ),
    );
    if (ok == true) { await ApiService().deleteNote(note.id); _load(); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.cream,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildSearch(),
            _buildFilters(),
            Expanded(child: _loading ? _buildSkeleton() : _notes.isEmpty ? _buildEmpty() : _buildList()),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 14, 18, 8),
      child: Row(
        children: [
          const Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('My Notes', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w500, color: AppConstants.text1)),
              Text('All your recordings', style: TextStyle(fontSize: 11, color: AppConstants.text2)),
            ],
          )),
          GestureDetector(
            onTap: _load,
            child: Container(
              width: 34, height: 34,
              decoration: BoxDecoration(color: AppConstants.sand, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppConstants.border)),
              child: const Icon(Icons.refresh_outlined, size: 18, color: AppConstants.text2),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearch() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: TextField(
        controller: _ctrl,
        onChanged: (v) { _search = v; _load(); },
        style: const TextStyle(fontSize: 13, color: AppConstants.text1),
        decoration: InputDecoration(
          hintText: 'Search notes...',
          hintStyle: const TextStyle(color: AppConstants.text3, fontSize: 13),
          prefixIcon: const Icon(Icons.search, color: AppConstants.text3, size: 18),
          suffixIcon: _search.isNotEmpty ? GestureDetector(
            onTap: () { _ctrl.clear(); _search = ''; _load(); },
            child: const Icon(Icons.clear, color: AppConstants.text3, size: 16),
          ) : null,
          filled: true, fillColor: AppConstants.sand,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppConstants.border)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppConstants.border)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppConstants.terra, width: 1.5)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
        ),
      ),
    );
  }

  Widget _buildFilters() {
    final filters = [('All', ''), ('Audio', 'audio'), ('Video', 'video'), ('YouTube', 'youtube')];
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: filters.map((f) {
            final active = _filter == f.$2;
            return GestureDetector(
              onTap: () { setState(() => _filter = f.$2); _load(); },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                decoration: BoxDecoration(
                  color: active ? AppConstants.terra : AppConstants.sand,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: active ? AppConstants.terra : AppConstants.border),
                ),
                child: Text(f.$1, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: active ? Colors.white : AppConstants.text2)),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildList() {
    return RefreshIndicator(
      onRefresh: _load,
      color: AppConstants.terra,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 20),
        itemCount: _notes.length,
        itemBuilder: (ctx, i) => _NoteItem(
          note: _notes[i],
          dotColor: [AppConstants.terra, AppConstants.amber, const Color(0xFF7CB8A0)][i % 3],
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => NoteDetailScreen(noteId: _notes[i].id))).then((_) => _load()),
          onDelete: () => _delete(_notes[i]),
        ).animate().fadeIn(delay: (i * 40).ms, duration: 300.ms),
      ),
    );
  }

  Widget _buildSkeleton() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      itemBuilder: (_, __) => Container(
        height: 64, margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(color: AppConstants.sand, borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      const Icon(Icons.notes_outlined, size: 48, color: AppConstants.text3),
      const SizedBox(height: 12),
      Text(_search.isNotEmpty ? 'No notes found' : 'No notes yet', style: const TextStyle(fontSize: 15, color: AppConstants.text2, fontWeight: FontWeight.w500)),
      const SizedBox(height: 6),
      Text(_search.isNotEmpty ? 'Try a different search' : 'Upload a recording to get started', style: const TextStyle(fontSize: 12, color: AppConstants.text3)),
    ]));
  }
}

class _NoteItem extends StatelessWidget {
  final Note note;
  final Color dotColor;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _NoteItem({required this.note, required this.dotColor, required this.onTap, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final duration = note.duration != null ? '${(note.duration! / 60).floor()} min' : 'N/A';
    final diff = DateTime.now().difference(note.createdAt).inDays;
    final date = diff == 0 ? 'Today' : diff == 1 ? 'Yesterday' : '$diff days ago';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(color: AppConstants.sand, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppConstants.border)),
        child: Row(
          children: [
            Container(width: 8, height: 8, decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle)),
            const SizedBox(width: 10),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(note.title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppConstants.text1), maxLines: 1, overflow: TextOverflow.ellipsis),
                Text('$duration · $date', style: const TextStyle(fontSize: 10, color: AppConstants.text2)),
              ],
            )),
            GestureDetector(onTap: onDelete, child: const Padding(padding: EdgeInsets.only(left: 8), child: Icon(Icons.delete_outline, size: 16, color: AppConstants.text3))),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right, size: 16, color: AppConstants.text3),
          ],
        ),
      ),
    );
  }
}
