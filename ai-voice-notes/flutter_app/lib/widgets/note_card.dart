import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/note_model.dart';
import '../utils/constants.dart';

class NoteCard extends StatelessWidget {
  final Note note;
  final VoidCallback onTap;
  final VoidCallback? onDelete;

  const NoteCard({
    super.key,
    required this.note,
    required this.onTap,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title row
              Row(
                children: [
                  Text(note.sourceIcon, style: const TextStyle(fontSize: 20)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      note.title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppConstants.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (onDelete != null)
                    GestureDetector(
                      onTap: onDelete,
                      child: const Icon(
                        Icons.delete_outline,
                        color: AppConstants.textSecondary,
                        size: 20,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),

              // Summary preview
              if (note.summary != null && note.summary!.isNotEmpty)
                Text(
                  note.summary!,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppConstants.textSecondary,
                    height: 1.4,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),

              const SizedBox(height: 10),

              // Keywords
              if (note.keywords.isNotEmpty)
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: note.keywords.take(4).map((keyword) {
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppConstants.primaryColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        keyword,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppConstants.primaryColor,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    );
                  }).toList(),
                ),

              const SizedBox(height: 10),

              // Footer: date + duration
              Row(
                children: [
                  const Icon(Icons.calendar_today_outlined, size: 13, color: AppConstants.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    DateFormat('MMM d, yyyy').format(note.createdAt),
                    style: const TextStyle(fontSize: 12, color: AppConstants.textSecondary),
                  ),
                  const SizedBox(width: 12),
                  const Icon(Icons.timer_outlined, size: 13, color: AppConstants.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    note.formattedDuration,
                    style: const TextStyle(fontSize: 12, color: AppConstants.textSecondary),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: _sourceColor(note.sourceType).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      note.sourceType.replaceAll('_', ' ').toUpperCase(),
                      style: TextStyle(
                        fontSize: 10,
                        color: _sourceColor(note.sourceType),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _sourceColor(String type) {
    switch (type) {
      case 'audio':
        return AppConstants.primaryColor;
      case 'video':
        return AppConstants.secondaryColor;
      case 'live_meeting':
        return AppConstants.errorColor;
      default:
        return AppConstants.textSecondary;
    }
  }
}
