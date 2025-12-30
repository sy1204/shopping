import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [msg, setMsg] = useState('');

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            const { error } = await signUp({ email, password });
            if (error) throw error;
            setMsg('회원가입 확인 메일을 발송했습니다. 이메일을 확인해주세요.');
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f5f5' }}>
            <form onSubmit={handleSignup} style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>회원가입</h2>
                {error && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '14px' }}>{error}</div>}
                {msg && <div style={{ color: 'green', marginBottom: '1rem', fontSize: '14px' }}>{msg}</div>}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px' }}>이메일</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px' }}>비밀번호</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                </div>
                <button type="submit" style={{ width: '100%', padding: '0.75rem', background: 'var(--accent-color, #007bff)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>회원가입</button>
                <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '14px' }}>
                    이미 계정이 있으신가요? <Link to="/login" style={{ color: 'var(--accent-color, #007bff)' }}>로그인</Link>
                </div>
            </form>
        </div>
    );
};

export default Signup;
