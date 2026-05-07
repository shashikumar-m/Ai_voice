import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:record/record.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';
import 'note_detail_screen.dart';

class LiveMeetingScreen extends StatefulWidget {
  const LiveMeetingScreen({super.key});

  @override
  State<LiveMeetingScreen> createState() => _LiveMeetingScreenState();
}

class _LiveMeetingScreenState extends State<LiveMeetingScreen> with TickerProviderStateMixin {
  final AudioRecorder _recorder = AudioRecorder();
  WebSocketChannel? _ws;

  bool _isRecording = false;
  bool _isPaused = false;
  bool _isProcessing = false;
  int _sessionId = -1;
  Duration _elapsed = Duration.zero;
  Timer? _timer;
  String _liveTranscript = '';
  List<String> _parts = [];

  late AnimationController _pulseCtrl;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat(reverse: true);
  }

  @override
  void dispose() {
    _timer?.cancel();
    _recorder.dispose();
    _ws?.sink.close();
    _pulseCtrl.dispose();
    super.dispose();
  }

  Future<void> _start() async {
    final ok = await _recorder.hasPermission();
    if (!ok) { _snack('Microphone permission denied'); return; }

    try {
      final result = await ApiService().startMeeting();
      _sessionId = result['session_id'];

      _ws = WebSocketChannel.connect(Uri.parse('${AppConstants.wsUrl}/meeting/$_sessionId/stream'));
      _ws!.stream.listen((data) {
        final msg = json.decode(data);
        if (msg['type'] == 'partial_transcript') {
          setState(() {
            _parts.add(msg['text']);
            _liveTranscript = _parts.join(' ');
          });
        }
      });

      await _recorder.start(const RecordConfig(encoder: AudioEncoder.opus), path: '');
      _timer = Timer.periodic(const Duration(seconds: 1), (_) => setState(() => _elapsed += const Duration(seconds: 1)));

      setState(() { _isRecording = true; _isPaused = false; _elapsed = Duration.zero; _liveTranscript = ''; _parts = []; });
    } catch (e) {
      _snack('Failed to start: $e');
    }
  }

  Future<void> _pauseResume() async {
    if (_isPaused) {
      await _recorder.resume();
      _timer = Timer.periodic(const Duration(seconds: 1), (_) => setState(() => _elapsed += const Duration(seconds: 1)));
    } else {
      await _recorder.pause();
      _timer?.cancel();
    }
    setState(() => _isPaused = !_isPaused);
  }

  Future<void> _end() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppConstants.cream,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('End Meeting?', style: TextStyle(color: AppConstants.text1, fontSize: 16, fontWeight: FontWeight.w500)),
        content: const Text('The recording will be processed and summarized.', style: TextStyle(color: AppConstants.text2, fontSize: 13)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel', style: TextStyle(color: AppConstants.text2))),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppConstants.terra, elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            child: const Text('End & Summarize', style: TextStyle(color: Colors.white, fontSize: 13)),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    _timer?.cancel();
    try { await _recorder.stop(); } catch (_) {}
    _ws?.sink.add(json.encode({'action': 'end'}));
    _ws?.sink.close();

    setState(() { _isRecording = false; _isProcessing = true; });

    try {
      final result = await ApiService().endMeeting(_sessionId);
      setState(() => _isProcessing = false);
      if (mounted && result['note_id'] != null) {
        Navigator.push(context, MaterialPageRoute(builder: (_) => NoteDetailScreen(noteId: result['note_id'])));
        _reset();
      }
    } catch (e) {
      setState(() => _isProcessing = false);
      _snack('Failed to process: $e');
    }
  }

  void _reset() => setState(() { _isRecording = false; _isPaused = false; _isProcessing = false; _sessionId = -1; _elapsed = Duration.zero; _liveTranscript = ''; _parts = []; });

  void _snack(String msg) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(
    content: Text(msg), backgroundColor: AppConstants.terra,
    behavior: SnackBarBehavior.floating,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
  ));

  String get _time {
    final m = _elapsed.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = _elapsed.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.cream,
      body: SafeArea(child: _isProcessing ? _buildProcessing() : _buildMain()),
    );
  }

  Widget _buildMain() {
    return Column(
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
          child: Row(
            children: [
              const Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Live Meeting', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w500, color: AppConstants.text1)),
                  Text('Real-time transcription', style: TextStyle(fontSize: 11, color: AppConstants.text2)),
                ],
              )),
              if (_isRecording)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(color: AppConstants.hotBg, borderRadius: BorderRadius.circular(20)),
                  child: Row(children: [
                    Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppConstants.terra, shape: BoxShape.circle)),
                    const SizedBox(width: 5),
                    const Text('Live', style: TextStyle(fontSize: 11, color: AppConstants.terra, fontWeight: FontWeight.w500)),
                  ]),
                ),
            ],
          ),
        ),

        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Pulse circle
                _buildPulseCircle(),
                const SizedBox(height: 20),

                // Timer
                if (_isRecording)
                  Text(_time, style: const TextStyle(fontSize: 38, fontWeight: FontWeight.w500, color: AppConstants.text1, letterSpacing: 2))
                      .animate().fadeIn(),

                const SizedBox(height: 16),

                // Live transcript
                if (_isRecording) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppConstants.sand,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppConstants.border),
                    ),
                    child: Text(
                      _liveTranscript.isEmpty ? '"Listening... speak clearly into your microphone"' : '"$_liveTranscript"',
                      style: TextStyle(fontSize: 11, color: AppConstants.text2, height: 1.7, fontStyle: _liveTranscript.isEmpty ? FontStyle.italic : FontStyle.normal),
                      maxLines: 4, overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text('Live transcript preview above', style: TextStyle(fontSize: 11, color: AppConstants.text3)),
                  const SizedBox(height: 20),
                ],

                // Buttons
                if (!_isRecording)
                  _buildStartButton()
                else
                  _buildControls(),

                if (!_isRecording) ...[
                  const SizedBox(height: 24),
                  _buildInstructions(),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPulseCircle() {
    if (!_isRecording) {
      return Container(
        width: 120, height: 120,
        decoration: BoxDecoration(color: AppConstants.sand, shape: BoxShape.circle, border: Border.all(color: AppConstants.border, width: 1.5)),
        child: const Icon(Icons.mic_none_outlined, size: 48, color: AppConstants.text3),
      );
    }

    return AnimatedBuilder(
      animation: _pulseCtrl,
      builder: (_, __) => Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: 120 + (_pulseCtrl.value * 24),
            height: 120 + (_pulseCtrl.value * 24),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppConstants.terra.withOpacity(0.1 * (1 - _pulseCtrl.value)),
            ),
          ),
          Container(
            width: 120, height: 120,
            decoration: BoxDecoration(
              color: _isPaused ? AppConstants.amber.withOpacity(0.15) : AppConstants.terra.withOpacity(0.12),
              shape: BoxShape.circle,
              border: Border.all(color: _isPaused ? AppConstants.amber.withOpacity(0.4) : AppConstants.terra.withOpacity(0.3), width: 1.5),
            ),
            child: Icon(Icons.mic, size: 48, color: _isPaused ? AppConstants.amber : AppConstants.terra),
          ),
        ],
      ),
    );
  }

  Widget _buildStartButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: _start,
        icon: const Icon(Icons.radio_button_checked, color: Colors.white, size: 18),
        label: const Text('Start Live Meeting', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500)),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppConstants.terra,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 0,
        ),
      ),
    );
  }

  Widget _buildControls() {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: _pauseResume,
            icon: Icon(_isPaused ? Icons.play_arrow : Icons.pause, size: 18),
            label: Text(_isPaused ? 'Resume' : 'Pause'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppConstants.amber,
              side: const BorderSide(color: AppConstants.amber),
              padding: const EdgeInsets.symmetric(vertical: 13),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: _end,
            icon: const Icon(Icons.stop, color: Colors.white, size: 18),
            label: const Text('End', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500)),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.terra,
              padding: const EdgeInsets.symmetric(vertical: 13),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInstructions() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: AppConstants.sand, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppConstants.border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('HOW IT WORKS', style: TextStyle(fontSize: 10, color: AppConstants.text3, letterSpacing: 0.8, fontWeight: FontWeight.w500)),
          const SizedBox(height: 8),
          ...['🎙️ Tap Start — microphone permission required', '📡 Audio transcribed every 30 seconds', '⏸️ Pause and resume anytime', '⏹️ End to generate full AI summary'].map((t) =>
            Padding(padding: const EdgeInsets.only(bottom: 5), child: Text(t, style: const TextStyle(fontSize: 12, color: AppConstants.text2, height: 1.5)))),
        ],
      ),
    );
  }

  Widget _buildProcessing() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(alignment: Alignment.center, children: [
              SizedBox(width: 84, height: 84, child: CircularProgressIndicator(color: AppConstants.terra2, strokeWidth: 2)),
              Container(width: 72, height: 72, decoration: BoxDecoration(color: AppConstants.terra, borderRadius: BorderRadius.circular(20)),
                child: const Icon(Icons.auto_awesome, color: Colors.white, size: 30)),
            ]),
            const SizedBox(height: 20),
            const Text('Generating your notes...', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: AppConstants.text1)),
            const SizedBox(height: 6),
            const Text('AI is summarizing your meeting', style: TextStyle(fontSize: 12, color: AppConstants.text2)),
          ],
        ),
      ),
    );
  }
}
