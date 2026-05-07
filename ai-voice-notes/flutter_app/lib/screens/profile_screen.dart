import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/auth_service.dart';
import '../utils/constants.dart';
import 'auth_screen.dart';

class ProfileScreen extends StatefulWidget {
  final VoidCallback? onLogout;
  const ProfileScreen({super.key, this.onLogout});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _auth = AuthService();

  Future<void> _logout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppConstants.cream,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Sign Out',
            style: GoogleFonts.inter(
                fontWeight: FontWeight.w700, color: AppConstants.text1)),
        content: Text(
          'Are you sure you want to sign out?',
          style: GoogleFonts.inter(color: AppConstants.text2, fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel',
                style: GoogleFonts.inter(color: AppConstants.text2)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Sign Out',
                style: GoogleFonts.inter(
                    color: AppConstants.terra, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await _auth.logout();
      widget.onLogout?.call();
    }
  }

  Future<void> _switchToAccount() async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const AuthScreen()),
    );
    if (result == true && mounted) {
      setState(() {});
      // Rebuild parent to switch to MainShell with logged-in state
      widget.onLogout?.call();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isGuest = _auth.isGuest;
    final user = _auth.user;

    return Scaffold(
      backgroundColor: AppConstants.cream,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              Text(
                'Profile',
                style: GoogleFonts.inter(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: AppConstants.text1,
                ),
              ),
              const SizedBox(height: 24),

              // Avatar + name card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppConstants.border),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        color: isGuest
                            ? AppConstants.sand
                            : AppConstants.terra.withOpacity(0.12),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isGuest ? Icons.person_outline : Icons.person_rounded,
                        color: isGuest ? AppConstants.text3 : AppConstants.terra,
                        size: 30,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isGuest ? 'Guest User' : (user?.name ?? ''),
                            style: GoogleFonts.inter(
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                              color: AppConstants.text1,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            isGuest
                                ? 'Not signed in — data not saved'
                                : (user?.email ?? ''),
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: isGuest
                                  ? AppConstants.amber
                                  : AppConstants.text2,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (isGuest)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppConstants.warmBg,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Guest',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppConstants.warmText,
                          ),
                        ),
                      ),
                  ],
                ),
              ),

              if (isGuest) ...[
                const SizedBox(height: 16),
                _buildGuestBanner(),
              ],

              const SizedBox(height: 24),

              // Actions
              if (isGuest) ...[
                _buildActionTile(
                  icon: Icons.login_rounded,
                  label: 'Sign In / Create Account',
                  subtitle: 'Save your notes and access them anywhere',
                  color: AppConstants.terra,
                  onTap: _switchToAccount,
                ),
              ] else ...[
                _buildActionTile(
                  icon: Icons.logout_rounded,
                  label: 'Sign Out',
                  subtitle: 'You will need to sign in again',
                  color: Colors.redAccent,
                  onTap: _logout,
                ),
              ],

              const SizedBox(height: 12),
              _buildActionTile(
                icon: Icons.info_outline_rounded,
                label: 'About',
                subtitle: 'VoiceNote AI v1.0.0',
                color: AppConstants.text2,
                onTap: () {},
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGuestBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppConstants.warmBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppConstants.amber.withOpacity(0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.warning_amber_rounded, color: AppConstants.amber, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Your notes are stored locally and will be lost if you clear the app. '
              'Sign in to keep your data safe.',
              style: GoogleFonts.inter(
                fontSize: 13,
                color: AppConstants.warmText,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String label,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppConstants.border),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppConstants.text1,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppConstants.text2,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: AppConstants.text3, size: 20),
          ],
        ),
      ),
    );
  }
}
