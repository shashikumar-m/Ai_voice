import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../utils/constants.dart';

class AuthScreen extends StatefulWidget {
  final VoidCallback? onDone;
  const AuthScreen({super.key, this.onDone});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> with SingleTickerProviderStateMixin {
  late TabController _tab;
  final _auth = AuthService();

  final _loginEmail   = TextEditingController();
  final _loginPass    = TextEditingController();
  final _regName      = TextEditingController();
  final _regEmail     = TextEditingController();
  final _regPass      = TextEditingController();
  final _regConfirm   = TextEditingController();

  bool _loading = false;
  bool _obscureLogin   = true;
  bool _obscureReg     = true;
  bool _obscureConfirm = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
    _tab.addListener(() => setState(() => _error = null));
  }

  @override
  void dispose() {
    _tab.dispose();
    _loginEmail.dispose(); _loginPass.dispose();
    _regName.dispose(); _regEmail.dispose(); _regPass.dispose(); _regConfirm.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final email = _loginEmail.text.trim();
    final pass  = _loginPass.text;
    if (email.isEmpty || pass.isEmpty) { setState(() => _error = 'Please fill in all fields'); return; }
    setState(() { _loading = true; _error = null; });
    try {
      await _auth.login(email: email, password: pass);
      if (mounted) widget.onDone?.call();
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _register() async {
    final name    = _regName.text.trim();
    final email   = _regEmail.text.trim();
    final pass    = _regPass.text;
    final confirm = _regConfirm.text;
    if (name.isEmpty || email.isEmpty || pass.isEmpty || confirm.isEmpty) { setState(() => _error = 'Please fill in all fields'); return; }
    if (pass != confirm) { setState(() => _error = 'Passwords do not match'); return; }
    if (pass.length < 6) { setState(() => _error = 'Password must be at least 6 characters'); return; }
    setState(() { _loading = true; _error = null; });
    try {
      await _auth.register(name: name, email: email, password: pass);
      if (mounted) widget.onDone?.call();
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _guestLogin() async {
    final alreadyShown = await _auth.hasShownGuestWarning();
    if (!alreadyShown && mounted) {
      await showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => _GuestWarningDialog(onContinue: () async {
          await _auth.markGuestWarningShown();
          if (mounted) Navigator.of(context).pop();
        }),
      );
    }
    await _auth.continueAsGuest();
    if (mounted) widget.onDone?.call();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F3FF), // violet-50 gradient bg
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const SizedBox(height: 48),
              _buildHeader(),
              const SizedBox(height: 32),
              _buildCard(),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Container(
          width: 72, height: 72,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppConstants.gradStart, AppConstants.gradEnd],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [BoxShadow(color: AppConstants.terra.withOpacity(0.35), blurRadius: 16, offset: const Offset(0, 6))],
          ),
          child: const Icon(Icons.mic_rounded, color: Colors.white, size: 36),
        ),
        const SizedBox(height: 16),
        const Text('AI Voice Notes',
            style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppConstants.text1)),
        const SizedBox(height: 6),
        const Text('Your AI-powered voice notes assistant',
            style: TextStyle(fontSize: 14, color: AppConstants.text2)),
      ],
    );
  }

  Widget _buildCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: AppConstants.terra.withOpacity(0.08), blurRadius: 24, offset: const Offset(0, 8)),
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          // Tab switcher
          Container(
            decoration: BoxDecoration(color: AppConstants.sand, borderRadius: BorderRadius.circular(12)),
            padding: const EdgeInsets.all(4),
            child: TabBar(
              controller: _tab,
              indicator: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(9),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 4, offset: const Offset(0, 1))],
              ),
              indicatorSize: TabBarIndicatorSize.tab,
              dividerColor: Colors.transparent,
              labelColor: AppConstants.terra,
              unselectedLabelColor: AppConstants.text2,
              labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w400, fontSize: 14),
              tabs: const [Tab(text: 'Sign In'), Tab(text: 'Register')],
            ),
          ),
          const SizedBox(height: 24),

          // Error
          if (_error != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFFECACA)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: Color(0xFFEF4444), size: 16),
                  const SizedBox(width: 8),
                  Expanded(child: Text(_error!, style: const TextStyle(fontSize: 13, color: Color(0xFFDC2626)))),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Forms
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: _tab.index == 0 ? _buildLoginForm() : _buildRegisterForm(),
          ),

          const SizedBox(height: 20),
          // Divider
          Row(children: [
            Expanded(child: Divider(color: AppConstants.border)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text('or', style: TextStyle(color: AppConstants.text3, fontSize: 13)),
            ),
            Expanded(child: Divider(color: AppConstants.border)),
          ]),
          const SizedBox(height: 16),

          // Guest button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton.icon(
              onPressed: _loading ? null : _guestLogin,
              icon: const Icon(Icons.person_outline, size: 18),
              label: const Text('Continue as Guest', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppConstants.text2,
                side: BorderSide(color: AppConstants.border, width: 1.5),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoginForm() {
    return Column(
      key: const ValueKey('login'),
      children: [
        _Field(controller: _loginEmail, label: 'Email', hint: 'you@example.com', icon: Icons.email_outlined, keyboardType: TextInputType.emailAddress),
        const SizedBox(height: 14),
        _Field(controller: _loginPass, label: 'Password', hint: '••••••••', icon: Icons.lock_outline, obscure: _obscureLogin, toggleObscure: () => setState(() => _obscureLogin = !_obscureLogin)),
        const SizedBox(height: 20),
        _PrimaryBtn(label: 'Sign In', loading: _loading, onTap: _loading ? null : _login),
      ],
    );
  }

  Widget _buildRegisterForm() {
    return Column(
      key: const ValueKey('register'),
      children: [
        _Field(controller: _regName, label: 'Full Name', hint: 'John Doe', icon: Icons.person_outline),
        const SizedBox(height: 14),
        _Field(controller: _regEmail, label: 'Email', hint: 'you@example.com', icon: Icons.email_outlined, keyboardType: TextInputType.emailAddress),
        const SizedBox(height: 14),
        _Field(controller: _regPass, label: 'Password', hint: 'Min. 6 characters', icon: Icons.lock_outline, obscure: _obscureReg, toggleObscure: () => setState(() => _obscureReg = !_obscureReg)),
        const SizedBox(height: 14),
        _Field(controller: _regConfirm, label: 'Confirm Password', hint: '••••••••', icon: Icons.lock_outline, obscure: _obscureConfirm, toggleObscure: () => setState(() => _obscureConfirm = !_obscureConfirm)),
        const SizedBox(height: 20),
        _PrimaryBtn(label: 'Create Account', loading: _loading, onTap: _loading ? null : _register),
      ],
    );
  }
}

class _Field extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData icon;
  final TextInputType keyboardType;
  final bool obscure;
  final VoidCallback? toggleObscure;

  const _Field({required this.controller, required this.label, required this.hint, required this.icon,
      this.keyboardType = TextInputType.text, this.obscure = false, this.toggleObscure});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppConstants.text1)),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: obscure,
          style: const TextStyle(fontSize: 15, color: AppConstants.text1),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: AppConstants.text3, fontSize: 14),
            prefixIcon: Icon(icon, color: AppConstants.text3, size: 20),
            suffixIcon: toggleObscure != null
                ? IconButton(
                    icon: Icon(obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: AppConstants.text3, size: 20),
                    onPressed: toggleObscure)
                : null,
          ),
        ),
      ],
    );
  }
}

class _PrimaryBtn extends StatelessWidget {
  final String label;
  final bool loading;
  final VoidCallback? onTap;
  const _PrimaryBtn({required this.label, required this.loading, this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [AppConstants.gradStart, AppConstants.gradEnd]),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [BoxShadow(color: AppConstants.terra.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 3))],
        ),
        child: ElevatedButton(
          onPressed: onTap,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: loading
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : Text(label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white)),
        ),
      ),
    );
  }
}

class _GuestWarningDialog extends StatelessWidget {
  final VoidCallback onContinue;
  const _GuestWarningDialog({required this.onContinue});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      backgroundColor: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56, height: 56,
              decoration: BoxDecoration(color: const Color(0xFFFEF3C7), borderRadius: BorderRadius.circular(16)),
              child: const Icon(Icons.info_outline_rounded, color: Color(0xFFF59E0B), size: 28),
            ),
            const SizedBox(height: 16),
            const Text('Guest Mode', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppConstants.text1)),
            const SizedBox(height: 10),
            const Text(
              'In guest mode, your notes are not saved to an account. If you clear the app or switch devices, your data will be lost.\n\nCreate a free account to keep your notes safe.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppConstants.text2, height: 1.5),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppConstants.gradStart, AppConstants.gradEnd]),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ElevatedButton(
                  onPressed: onContinue,
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  child: const Text('Continue as Guest', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
                ),
              ),
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Go back and sign in', style: TextStyle(fontSize: 13, color: AppConstants.terra, fontWeight: FontWeight.w500)),
            ),
          ],
        ),
      ),
    );
  }
}
