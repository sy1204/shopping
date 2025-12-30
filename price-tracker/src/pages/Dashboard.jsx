
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ShoppingBag, X, StickyNote, Plus, LogIn, LogOut, ExternalLink, Bell, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    // Admin Redirect Check
    useEffect(() => {
        if (user && user.email === 'enrichdotcom@naver.com') {
            navigate('/admin', { replace: true });
        }
    }, [user, navigate]);

    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [urlInput, setUrlInput] = useState("");
    const [isEditingMemo, setIsEditingMemo] = useState(false);
    const [tempMemo, setTempMemo] = useState("");
    const [notification, setNotification] = useState(null);

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const API_BASE_URL = 'http://localhost:3001/api';

    const fetchProducts = async () => {
        // Optional: If you want to show public demo data when logged out, keep fetching.
        // If you want to show ONLY user data, check if user exists.
        // For now, let's allow fetching (assuming API handles public/private filtering or just shows all for local dev).
        try {
            const response = await fetch(`${API_BASE_URL}/products`);
            if (!response.ok) throw new Error('Failed to fetch products');
            const data = await response.json();
            setProducts(data);
            if (data.length > 0 && !selectedProduct) {
                setSelectedProduct(data[0]);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            setNotification({ message: '상품 목록을 불러오는 데 실패했습니다.', type: 'error' });
        }
    };

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        fetchProducts();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 768;

    // URL로 새 상품 추가 (백엔드 등록 요청)
    const addNewProductByUrl = async () => {
        if (!user) {
            setNotification({ message: '상품 등록은 로그인이 필요합니다.', type: 'error' });
            setTimeout(() => navigate('/login'), 1500);
            return;
        }

        const url = urlInput.trim();
        if (!url) return;

        if (!url.startsWith('http')) {
            setNotification({ message: '올바른 URL을 입력해주세요 (http://...)', type: 'error' });
            return;
        }

        setNotification({ message: '상품 정보를 가져오는 중입니다...', type: 'info' });

        try {
            const response = await fetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (!response.ok) throw new Error('Failed to register product');

            await response.json();

            setNotification({ message: '상품이 성공적으로 등록되었습니다!', type: 'success' });
            setUrlInput("");

            // 목록 갱신
            await fetchProducts();

        } catch (error) {
            console.error("Registration error:", error);
            setNotification({ message: '상품 등록에 실패했습니다.', type: 'error' });
        }
    };

    const removeProduct = (id, e) => {
        e.stopPropagation();
        if (!user) return; // Prevent deletion if not logged in

        // In real app, call API DELETE here
        const filtered = products.filter(p => p.id !== id);
        setProducts(filtered);
        if (selectedProduct?.id === id) {
            setSelectedProduct(filtered[0] || null);
        }
    };

    const updateMemo = (productId, newMemo) => {
        const updated = products.map(p =>
            p.id === productId ? { ...p, memo: newMemo } : p
        );
        setProducts(updated);
        if (selectedProduct.id === productId) {
            setSelectedProduct(updated.find(p => p.id === productId));
        }
    };

    const adjustTargetPrice = (delta) => {
        if (!selectedProduct) return;
        const currentTarget = selectedProduct.targetPrice || 0;
        const newPrice = Math.max(0, currentTarget + delta);

        const updated = products.map(p =>
            p.id === selectedProduct.id ? { ...p, targetPrice: newPrice } : p
        );
        setProducts(updated);
        setSelectedProduct({ ...selectedProduct, targetPrice: newPrice });
    };

    const toggleAlertOption = (option) => {
        if (!selectedProduct) return;
        const currentOptions = selectedProduct.alertOptions || { priceDrop: true, targetHit: true };
        const newOptions = { ...currentOptions, [option]: !currentOptions[option] };

        const updated = products.map(p =>
            p.id === selectedProduct.id ? { ...p, alertOptions: newOptions } : p
        );
        setProducts(updated);
        setSelectedProduct({ ...selectedProduct, alertOptions: newOptions });
    };

    // Helper to get primary mall data (assuming first mall or lowest price one)
    const getPrimaryMallData = (product) => {
        if (!product || !product.malls || product.malls.length === 0) return null;
        return product.malls.reduce((prev, curr) => curr.price < prev.price ? curr : prev);
    };

    const primaryMallData = getPrimaryMallData(selectedProduct);
    const currentPrice = primaryMallData ? primaryMallData.price : 0;

    return (
        <div className="container" style={{
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            padding: isMobile ? '0.5rem' : '1.5rem',
            boxSizing: 'border-box',
            overflow: 'hidden',
            fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif'
        }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#3b82f6', color: 'white', padding: '8px', borderRadius: '8px' }}>
                        <ShoppingBag size={24} />
                    </div>
                    <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#111' }}>눈팅 (Noonting)</h1>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {user ? (
                        <>
                            <div
                                onClick={() => navigate('/profile')}
                                style={{ fontSize: '14px', color: '#666', marginRight: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                                <span style={{ fontWeight: 'bold' }}>{user.email?.split('@')[0]}</span>님
                            </div>
                            <button
                                onClick={() => signOut()}
                                title="로그아웃"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
                            >
                                <LogOut size={20} />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => navigate('/login')}
                            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <LogIn size={16} /> 로그인
                        </button>
                    )}
                </div>
            </header>

            {/* Notification Toast */}
            {notification && (
                <div style={{
                    position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
                    background: notification.type === 'success' ? '#10b981' : (notification.type === 'error' ? '#ef4444' : '#3b82f6'),
                    color: 'white', padding: '10px 20px', borderRadius: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    zIndex: 9999, fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                    animation: 'fadeInOut 3s forwards'
                }}>
                    {notification.message}
                </div>
            )}

            {/* Main Layout: 2 Columns */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '320px 1fr',
                gap: '2rem',
                flex: 1,
                minHeight: 0,
                height: '100%'
            }}>

                {/* LEFT: Product List & Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflow: 'hidden' }}>

                    {/* URL Input Box */}
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px', color: '#444' }}>새 상품 등록</div>
                        <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                            <input
                                placeholder={user ? "상품 URL을 입력하세요" : "로그인이 필요합니다"}
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addNewProductByUrl()}
                                disabled={!user}
                                style={{
                                    flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd',
                                    fontSize: '13px', outline: 'none', background: user ? '#f9fafb' : '#eee', cursor: user ? 'text' : 'not-allowed'
                                }}
                            />
                            <button
                                onClick={addNewProductByUrl}
                                disabled={!user}
                                style={{ padding: '0 12px', background: user ? '#3b82f6' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', cursor: user ? 'pointer' : 'default' }}
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                        <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px', paddingLeft: '4px' }}>
                            나의 관심 상품 ({products.length})
                        </div>

                        {products.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#ccc', fontSize: '14px' }}>
                                등록된 상품이 없습니다.
                            </div>
                        ) : (
                            products.map(product => {
                                const isSelected = selectedProduct?.id === product.id;
                                const pData = getPrimaryMallData(product);
                                const pPrice = pData ? pData.price : 0;
                                const isTargetMet = product.targetPrice > 0 && pPrice <= product.targetPrice;

                                return (
                                    <div key={product.id}
                                        onClick={() => setSelectedProduct(product)}
                                        style={{
                                            display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px',
                                            background: isSelected ? '#edf7ff' : 'white',
                                            border: isSelected ? '1px solid #3b82f6' : '1px solid #f0f0f0',
                                            cursor: 'pointer', transition: 'all 0.2s', alignItems: 'center'
                                        }}
                                    >
                                        <img src={product.image} alt="" style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '6px', background: 'white' }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {product.name}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                                <span style={{ fontSize: '13px', color: isTargetMet ? '#10b981' : '#666', fontWeight: isTargetMet ? 'bold' : 'normal' }}>
                                                    {pPrice.toLocaleString()}원
                                                </span>
                                                <span style={{ fontSize: '11px', color: '#aaa' }}>{pData?.name || '-'}</span>
                                            </div>
                                        </div>
                                        {user && (
                                            <button
                                                onClick={(e) => removeProduct(product.id, e)}
                                                style={{ color: '#ccc', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT (Center): Detail View */}
                <div style={{
                    background: 'white', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                    padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', border: '1px solid #f0f0f0'
                }}>
                    {!selectedProduct ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                            상품을 선택하면 상세 정보가 표시됩니다.
                        </div>
                    ) : (
                        <>
                            {/* 1. Header & Price */}
                            <div style={{ display: 'flex', gap: '2rem' }}>
                                <div style={{ width: '120px', height: '120px', padding: '10px', border: '1px solid #eee', borderRadius: '16px', flexShrink: 0 }}>
                                    <img src={selectedProduct.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <span style={{ background: '#f3f4f6', color: '#666', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                                            {primaryMallData?.name || 'Unknown'}
                                        </span>
                                        <a href={primaryMallData?.url || '#'} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                            상품 보러가기 <ExternalLink size={12} />
                                        </a>
                                    </div>
                                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111', margin: '0 0 12px 0', lineHeight: 1.3 }}>
                                        {selectedProduct.name}
                                    </h2>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                        <span style={{ fontSize: '36px', fontWeight: '800', color: '#111' }}>
                                            {primaryMallData?.price.toLocaleString() || 0}
                                        </span>
                                        <span style={{ fontSize: '20px', color: '#666' }}>원</span>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Chart */}
                            <div style={{ height: '300px', width: '100%', background: '#fafafa', borderRadius: '16px', padding: '1.5rem' }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#666', marginBottom: '1rem' }}>가격 변동 추이</div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={primaryMallData?.histories || []}>
                                        <XAxis dataKey="date" hide />
                                        <YAxis domain={['auto', 'auto']} orientation="right" tick={{ fontSize: 12, fill: '#aaa' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            formatter={(val) => [`${val.toLocaleString()}원`, '가격']}
                                        />
                                        <ReferenceLine y={selectedProduct.targetPrice} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'right', value: '목표가', fill: '#10b981', fontSize: 12 }} />
                                        <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* 3. Settings & Memo */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>

                                {/* Target Price */}
                                <div style={{ padding: '1.5rem', border: '1px solid #f0f0f0', borderRadius: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333' }}>목표 가격 설정</div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>
                                            현재가 대비 <span style={{ color: currentPrice <= selectedProduct.targetPrice ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                                                {currentPrice > 0 ? Math.round(((selectedProduct.targetPrice - currentPrice) / currentPrice) * 100) : 0}%
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                        <button onClick={() => adjustTargetPrice(-100)} disabled={!user} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #ddd', background: 'white', cursor: user ? 'pointer' : 'default', opacity: user ? 1 : 0.5 }}>-</button>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: selectedProduct.targetPrice > 0 ? '#10b981' : '#ccc' }}>
                                            {selectedProduct.targetPrice.toLocaleString()}원
                                        </div>
                                        <button onClick={() => adjustTargetPrice(100)} disabled={!user} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #ddd', background: 'white', cursor: user ? 'pointer' : 'default', opacity: user ? 1 : 0.5 }}>+</button>
                                    </div>
                                </div>

                                {/* Alarm Settings */}
                                <div style={{ padding: '1.5rem', border: '1px solid #f0f0f0', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Bell size={16} /> 알림 설정
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: user ? 'pointer' : 'default', opacity: user ? 1 : 0.5 }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedProduct.alertOptions?.targetHit !== false}
                                                onChange={() => toggleAlertOption('targetHit')}
                                                disabled={!user}
                                                style={{ accentColor: '#3b82f6' }}
                                            />
                                            목표가 도달 시 알림
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: user ? 'pointer' : 'default', opacity: user ? 1 : 0.5 }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedProduct.alertOptions?.priceDrop !== false}
                                                onChange={() => toggleAlertOption('priceDrop')}
                                                disabled={!user}
                                                style={{ accentColor: '#3b82f6' }}
                                            />
                                            가격 하락 시 알림 (전일 대비)
                                        </label>
                                    </div>
                                </div>

                                {/* Memo */}
                                <div style={{ padding: '1.5rem', border: '1px solid #f0f0f0', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <StickyNote size={16} /> 나의 메모
                                        </div>
                                        {isEditingMemo ? (
                                            <button onClick={() => { updateMemo(selectedProduct.id, tempMemo); setIsEditingMemo(false); }} style={{ fontSize: '12px', fontWeight: 'bold', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>저장</button>
                                        ) : (
                                            <button onClick={() => { setTempMemo(selectedProduct.memo || ""); setIsEditingMemo(true); }} disabled={!user} style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: user ? 'pointer' : 'default', opacity: user ? 1 : 0.5 }}>수정</button>
                                        )}
                                    </div>

                                    {isEditingMemo ? (
                                        <textarea
                                            value={tempMemo}
                                            onChange={(e) => setTempMemo(e.target.value)}
                                            style={{ width: '100%', flex: 1, borderRadius: '8px', border: '1px solid #ddd', padding: '10px', resize: 'none', fontSize: '13px' }}
                                            placeholder="상품에 대한 메모를 남겨보세요."
                                        />
                                    ) : (
                                        <div style={{ flex: 1, fontSize: '13px', color: '#555', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                            {selectedProduct.memo || "메모가 없습니다."}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Dashboard;
