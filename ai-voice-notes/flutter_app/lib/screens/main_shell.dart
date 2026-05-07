import 'package:flutter/material.dart';
import '../utils/constants.dart';
import '../services/auth_service.dart';
import 'home_screen.dart';
import 'upload_screen.dart';
import 'notes_screen.dart';
import 'profile_screen.dart';

class MainShell extends StatefulWidget {
  final VoidCallback? onLogout;
  const MainShell({super.key, this.onLogout});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  List<Widget> get _screens => [
    const HomeScreen(),
    const UploadScreen(),
    const NotesScreen(),
    ProfileScreen(onLogout: widget.onLogout),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.cream,
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: _buildNav(),
    );
  }

  Widget _buildNav() {
    final auth = AuthService();
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppConstants.border, width: 1)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -2))],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _NavItem(icon: Icons.home_outlined, activeIcon: Icons.home_rounded, label: 'Home', index: 0, current: _index, onTap: (i) => setState(() => _index = i)),
              _NavItem(icon: Icons.upload_file_outlined, activeIcon: Icons.upload_file_rounded, label: 'Upload', index: 1, current: _index, onTap: (i) => setState(() => _index = i)),
              _NavItem(icon: Icons.notes_outlined, activeIcon: Icons.notes_rounded, label: 'Notes', index: 2, current: _index, onTap: (i) => setState(() => _index = i)),
              _NavItem(
                icon: auth.isGuest ? Icons.person_outline : Icons.account_circle_outlined,
                activeIcon: auth.isGuest ? Icons.person : Icons.account_circle,
                label: auth.isGuest ? 'Guest' : 'Profile',
                index: 3,
                current: _index,
                onTap: (i) => setState(() => _index = i),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final int index;
  final int current;
  final Function(int) onTap;

  const _NavItem({required this.icon, required this.activeIcon, required this.label,
      required this.index, required this.current, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final active = index == current;
    return GestureDetector(
      onTap: () => onTap(index),
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(active ? activeIcon : icon,
                color: active ? AppConstants.terra : AppConstants.text3, size: 22),
            const SizedBox(height: 3),
            Text(label, style: TextStyle(
              fontSize: 10,
              fontWeight: active ? FontWeight.w600 : FontWeight.w400,
              color: active ? AppConstants.terra : AppConstants.text3,
            )),
          ],
        ),
      ),
    );
  }
}
