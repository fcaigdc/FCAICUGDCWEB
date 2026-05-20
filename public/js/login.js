// Login page script - Handle form submissions and tab switching
document.addEventListener('DOMContentLoaded', function() {
    console.log('Login script initializing');

    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('.btn-primary');
            btn.disabled = true;
            btn.textContent = 'Logging in...';
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('role', data.role || 'student');
                    localStorage.setItem('email', data.email || email);
                    if (data.name) {
                        localStorage.setItem('name', data.name);
                    }
                    showToast('Login successful!', 'success');
                    window.location.href = '/';
                } else {
                    showToast(data.error || 'Login failed', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                showToast('Login failed - ' + error.message, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Login';
            }
        });
    }

    // Register Student Form
    const registerStudentForm = document.getElementById('register-student-form');
    if (registerStudentForm) {
        registerStudentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('student-name').value;
            const email = document.getElementById('student-email').value;
            const password = document.getElementById('student-password').value;
            const confirmPassword = document.getElementById('student-confirm-password').value;
            const linkedin = document.getElementById('student-linkedin').value;

            // Validate password confirmation
            if (password !== confirmPassword) {
                showToast('Passwords do not match', 'error');
                return;
            }

            try {
                const response = await fetch('/api/auth/register/student', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, linkedin })
                });

                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('hasRegistered', 'true');
                    showToast('Account created! Please log in.', 'success');
                    
                    // Redirect to login tab
                    const loginBtn = document.querySelector('.nav-btn[data-target="login-form-container"]');
                    if (loginBtn) activateForm(loginBtn);
                    
                    registerStudentForm.reset();
                } else {
                    showToast(data.error || 'Registration failed', 'error');
                }
            } catch (error) {
                console.error('Registration error:', error);
                showToast('Registration failed - ' + error.message, 'error');
            }
        });
    }

    // Register Company Form
    const registerCompanyForm = document.getElementById('register-company-form');
    if (registerCompanyForm) {
        registerCompanyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('company-name').value;
            const email = document.getElementById('company-email').value;
            const password = document.getElementById('company-password').value;
            const confirmPassword = document.getElementById('company-confirm-password').value;

            // Validate password confirmation
            if (password !== confirmPassword) {
                showToast('Passwords do not match', 'error');
                return;
            }

            try {
                const response = await fetch('/api/auth/register/company', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('hasRegistered', 'true');
                    showToast('Account created! Please log in.', 'success');
                    
                    // Redirect to login tab
                    const loginBtn = document.querySelector('.nav-btn[data-target="login-form-container"]');
                    if (loginBtn) activateForm(loginBtn);
                    
                    registerCompanyForm.reset();
                } else {
                    showToast(data.error || 'Registration failed', 'error');
                }
            } catch (error) {
                console.error('Registration error:', error);
                showToast('Registration failed - ' + error.message, 'error');
            }
        });
    }

    // Dynamic Success Panel Helper
    function showSuccessPanel(title, subtitle, message) {
        const successPanel = document.getElementById('success-panel');
        if (!successPanel) return;

        const h2 = successPanel.querySelector('h2');
        const p_subtitle = successPanel.querySelector('.form-header p');
        const p_body = successPanel.querySelector('.form-body p');

        if (h2) h2.textContent = title;
        if (p_subtitle) p_subtitle.textContent = subtitle;
        if (p_body) p_body.textContent = message;

        successPanel.classList.add('active');
    }

    // Close Success Panel
    const closePanel = document.getElementById('close-panel');
    if (closePanel) {
        closePanel.addEventListener('click', () => {
            const successPanel = document.getElementById('success-panel');
            if (successPanel) successPanel.classList.remove('active');
            window.location.href = '/';
        });
    }

    // Social Login Placeholders
    document.querySelectorAll('.google-btn, .facebook-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showToast('Social login not implemented yet', 'info');
        });
    });

    // Tabbed panel switching for login/register - Updated for Asian Scroll Animation
    const navButtons = document.querySelectorAll('.nav-btn');
    const formContainers = document.querySelectorAll('.form-container');

    function activateForm(button) {
        const targetId = button.dataset.target;

        // Update navigation buttons
        navButtons.forEach(btn => {
            const isActive = btn === button;
            btn.classList.toggle('active', isActive);
        });

        // Update form containers with Asian scroll animation
        formContainers.forEach(container => {
            const isTarget = container.id === targetId;
            if (isTarget) {
                container.classList.add('active');
            } else {
                container.classList.remove('active');
            }
        });
    }

    // Add click event listeners to navigation buttons
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            activateForm(button);
        });
    });

    // Add click event listeners to switch links
    const switchLinks = document.querySelectorAll('.switch-link');
    switchLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.dataset.target;
            const targetButton = document.querySelector(`.nav-btn[data-target="${targetId}"]`);
            if (targetButton) {
                activateForm(targetButton);
            }
        });
    });

    // Initialize with login form active
    const loginBtn = document.querySelector('.nav-btn[data-target="login-form-container"]');
    if (loginBtn) {
        activateForm(loginBtn);
    }

    // Password toggle functionality
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            const icon = this.querySelector('i');

            if (targetInput.type === 'password') {
                targetInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                targetInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Forgot Password functionality
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const forgotPasswordForm = document.getElementById('forgot-password-form');

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            const targetButton = document.querySelector(`.nav-btn[data-target="forgot-form-container"]`);
            if (targetButton) activateForm(targetButton);
        });
    }

    let resetEmailStr = '';
    let resetOtpStr = '';

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            resetEmailStr = document.getElementById('reset-email').value;
            const btn = e.target.querySelector('.btn-primary');
            btn.disabled = true;
            btn.textContent = 'Sending...';

            try {
                const res = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: resetEmailStr })
                });
                
                if (res.ok) {
                    showToast('A 6-digit code has been sent to your email', 'success');
                    // Hide forgot form, show verify OTP form via animation function
                    activateForm({ dataset: { target: 'verify-otp-container' } });
                } else {
                    const data = await res.json();
                    showToast(data.error || 'Failed to send reset code', 'error');
                }
            } catch (error) {
                console.error(error);
                showToast('Network error', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Send Reset Code';
            }
        });
    }

    const verifyOtpForm = document.getElementById('verify-otp-form');
    if (verifyOtpForm) {
        verifyOtpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            resetOtpStr = document.getElementById('otp-code').value.trim();
            const btn = e.target.querySelector('.btn-primary');
            btn.disabled = true;
            btn.textContent = 'Verifying...';

            try {
                const res = await fetch('/api/auth/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: resetEmailStr, otp: resetOtpStr })
                });
                
                if (res.ok) {
                    showToast('OTP Verified!', 'success');
                    activateForm({ dataset: { target: 'reset-password-container' } });
                } else {
                    const data = await res.json();
                    showToast(data.error || 'Invalid OTP', 'error');
                }
            } catch (error) {
                console.error(error);
                showToast('Network error', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Verify Code';
            }
        });
    }

    const newPasswordForm = document.getElementById('new-password-form');
    if (newPasswordForm) {
        newPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPass = document.getElementById('new-pass').value;
            const confirmNewPass = document.getElementById('confirm-new-pass').value;

            if (newPass !== confirmNewPass) {
                showToast('Passwords do not match', 'error');
                return;
            }

            const btn = e.target.querySelector('.btn-primary');
            btn.disabled = true;
            btn.textContent = 'Resetting...';

            try {
                const res = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: resetEmailStr, otp: resetOtpStr, newPassword: newPass })
                });
                
                if (res.ok) {
                    const data = await res.json();
                    showToast('Password reset successfully! Logging you in...', 'success');
                    
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('role', data.role || 'student');
                        // Optional: you could fetch profile to get image, but role is enough for now
                        setTimeout(() => {
                            window.location.href = data.role === 'admin' ? '/admin' : '/profile';
                        }, 1000);
                    }
                    
                    forgotPasswordForm.reset();
                    verifyOtpForm.reset();
                    newPasswordForm.reset();
                } else {
                    const data = await res.json();
                    showToast(data.error || 'Failed to reset password', 'error');
                }
            } catch (error) {
                console.error(error);
                showToast('Network error', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Reset Password';
            }
        });
    }

    const resendBtn = document.getElementById('resend-otp-btn');
    if (resendBtn) {
        resendBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (resendBtn.disabled) return;
            
            resendBtn.disabled = true;
            const originalText = resendBtn.textContent || 'Resend Code';
            
            try {
                const res = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: resetEmailStr })
                });
                if (res.ok) {
                    showToast('A new code has been sent', 'info');
                    // 60-second cooldown
                    let timeLeft = 60;
                    resendBtn.textContent = `Wait ${timeLeft}s`;
                    const interval = setInterval(() => {
                        timeLeft--;
                        resendBtn.textContent = `Wait ${timeLeft}s`;
                        if (timeLeft <= 0) {
                            clearInterval(interval);
                            resendBtn.disabled = false;
                            resendBtn.textContent = originalText;
                        }
                    }, 1000);
                } else {
                    const data = await res.json();
                    showToast(data.error || 'Failed to resend code', 'error');
                    resendBtn.disabled = false;
                    resendBtn.textContent = originalText;
                }
            } catch (error) {
                showToast('Failed to resend code', 'error');
                resendBtn.disabled = false;
                resendBtn.textContent = originalText;
            }
        });
    }

});
