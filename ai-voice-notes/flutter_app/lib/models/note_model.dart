class Note {
  final int id;
  final String title;
  final String transcript;
  final String? summary;
  final List<String> keywords;
  final String sourceType;
  final String language;
  final double? duration;
  final DateTime createdAt;

  Note({
    required this.id,
    required this.title,
    required this.transcript,
    this.summary,
    required this.keywords,
    required this.sourceType,
    required this.language,
    this.duration,
    required this.createdAt,
  });

  factory Note.fromJson(Map<String, dynamic> json) {
    return Note(
      id: json['id'],
      title: json['title'],
      transcript: json['transcript'],
      summary: json['summary'],
      keywords: List<String>.from(json['keywords'] ?? []),
      sourceType: json['source_type'],
      language: json['language'],
      duration: json['duration']?.toDouble(),
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'transcript': transcript,
      'summary': summary,
      'keywords': keywords,
      'source_type': sourceType,
      'language': language,
      'duration': duration,
      'created_at': createdAt.toIso8601String(),
    };
  }

  String get formattedDuration {
    if (duration == null) return 'N/A';
    final minutes = (duration! / 60).floor();
    final seconds = (duration! % 60).floor();
    return '${minutes}m ${seconds}s';
  }

  String get sourceIcon {
    switch (sourceType) {
      case 'audio':
        return '🎵';
      case 'video':
        return '🎥';
      case 'live_meeting':
        return '🔴';
      case 'youtube':
        return '▶️';
      default:
        return '📝';
    }
  }
}
