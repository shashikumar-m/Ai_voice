import 'package:flutter/material.dart';
import '../utils/constants.dart';

class ProcessingScreen extends StatelessWidget {
  final List<Map<String, dynamic>> steps;

  const ProcessingScreen({super.key, required this.steps});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.cream,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Spinning icon
                Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 84, height: 84,
                      child: CircularProgressIndicator(
                        color: AppConstants.terra2,
                        strokeWidth: 2,
                      ),
                    ),
                    Container(
                      width: 72, height: 72,
                      decoration: BoxDecoration(
                        color: AppConstants.terra,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Icon(Icons.auto_awesome, color: Colors.white, size: 30),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                const Text('Analyzing your note', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: AppConstants.text1)),
                const SizedBox(height: 6),
                const Text('AI is working on your recording', style: TextStyle(fontSize: 12, color: AppConstants.text2), textAlign: TextAlign.center),
                const SizedBox(height: 24),
                ...steps.map((s) => _StepItem(
                  icon: s['icon'] as IconData,
                  label: s['label'] as String,
                  status: s['status'] as String,
                )),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StepItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String status; // 'done' | 'active' | 'pending'

  const _StepItem({required this.icon, required this.label, required this.status});

  @override
  Widget build(BuildContext context) {
    Color iconBg;
    Color iconColor;
    Color statusColor;

    switch (status) {
      case 'done':
        iconBg = const Color(0xFFE8F5EF); iconColor = const Color(0xFF307060); statusColor = const Color(0xFF4A9070);
        break;
      case 'active':
        iconBg = AppConstants.terra; iconColor = Colors.white; statusColor = AppConstants.terra;
        break;
      default:
        iconBg = AppConstants.warm; iconColor = AppConstants.text3; statusColor = AppConstants.text3;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppConstants.sand,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: status == 'active' ? AppConstants.terra.withOpacity(0.4) : AppConstants.border),
      ),
      child: Row(
        children: [
          Container(
            width: 28, height: 28,
            decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, size: 14, color: iconColor),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(label, style: TextStyle(fontSize: 12, color: status == 'pending' ? AppConstants.text3 : AppConstants.text1))),
          Text(
            status == 'done' ? 'Done' : status == 'active' ? 'Running' : 'Pending',
            style: TextStyle(fontSize: 10, color: statusColor),
          ),
        ],
      ),
    );
  }
}
