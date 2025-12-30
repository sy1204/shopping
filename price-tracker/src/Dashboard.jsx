import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Search, Bell, ShoppingBag, ArrowDown, ArrowUp, Store, CheckCircle, ChevronRight, X, Target, StickyNote, Info, Plus, List, BarChart2, Repeat, LogOut } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';

function Dashboard() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedMallIndex, setSelectedMallIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditingMemo, setIsEditingMemo] = useState(false);
    const [tempMemo, setTempMemo] = useState("");
    const [notification, setNotification] = useState(null);

    const [newMallUrl, setNewMallUrl] = useState("");
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [activeTab, setActiveTab] = useState('interest');

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    // Fetch products from backend
    const fetchProducts = async () => {
        if (!user) {
            setProducts([]);
            return;
        }
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`${API_BASE_URL}/products`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            if (!response.ok) {
                if (response.status === 401) return;
                throw new Error('Failed to fetch products');
            }
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
    }, [user]);

    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1200;
    const isPC = windowWidth >= 1200;

    const addMallByUrl = (productId, url) => {
        if (!url.trim()) return;
        setNotification({ message: '쇼핑몰 URL 등록은 아직 서버와 연동되지 않았습니다.', type: 'error' });
    };

    const handleSearch = async (e) => {
        if (e.key === 'Enter' && searchTerm.trim() !== "") {
            if (!user) {
                setNotification({ message: '로그인이 필요한 기능입니다. 로그인 페이지로 이동합니다.', type: 'error' });
                setTimeout(() => navigate('/login'), 1500);
                return;
            }

            setNotification({ message: '상품을 검색하고 분석 중입니다...', type: 'success' });

            try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                const response = await fetch(`${API_BASE_URL}/search`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    },
                    body: JSON.stringify({ query: searchTerm })
                });

                if (!response.ok) throw new Error('Search failed');

                const result = await response.json();
                await fetchProducts();

                setNotification({ message: '검색 및 상품 등록이 완료되었습니다!', type: 'success' });
                setSearchTerm("");

            } catch (error) {
                console.error("Search error:", error);
                setNotification({ message: '검색 중 오류가 발생했습니다.', type: 'error' });
            }
        }
    };

    // Keep existing helper functions unchanged...
    const addToInterest = (keyword) => {
        if (products.some(p => p.name === keyword)) {
            alert("이미 관심 상품에 등록되어 있습니다.");
            return;
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

    const removeProduct = (id, e) => {
        e.stopPropagation();
        const filtered = products.filter(p => p.id !== id);
        setProducts(filtered);
        if (selectedProduct.id === id && filtered.length > 0) {
            const nextProd = filtered[0];
            setSelectedProduct(nextProd);
            const bestIdx = nextProd.malls.reduce((minIdx, m, idx, arr) => m.price < arr[minIdx].price ? idx : minIdx, 0);
            setSelectedMallIndex(bestIdx);
        } else if (filtered.length === 0) {
            setSelectedProduct(null);
        }
    };

    const updateTargetPrice = (id, newPrice) => {
        const updated = products.map(p =>
            p.id === id ? { ...p, targetPrice: parseInt(newPrice) || 0 } : p
        );
        setProducts(updated);
        if (selectedProduct.id === id) {
            setSelectedProduct(updated.find(p => p.id === id));
        }
    };

    const toggleAlertOption = (productId, option, e) => {
        e.stopPropagation();
        const updated = products.map(p =>
            p.id === productId ? {
                ...p,
                alertOptions: { ...p.alertOptions, [option]: !p.alertOptions?.[option] }
            } : p
        );
        setProducts(updated);
        if (selectedProduct.id === productId) {
            setSelectedProduct(updated.find(p => p.id === productId));
        }
    };


    // Derived state
    const currentMallData = selectedProduct ? selectedProduct.malls[selectedMallIndex] : null;
    const currentPrice = currentMallData ? currentMallData.price : 0;
    const targetPrice = selectedProduct ? selectedProduct.targetPrice : 0;
    const isGoodPrice = currentPrice <= (targetPrice || 0);
    const histories = currentMallData ? currentMallData.histories : [];
    const prevPrice = histories.length >= 2 ? histories[histories.length - 2].price : currentPrice;
    const priceDiff = currentPrice - prevPrice;
    const minPrice = selectedProduct ? Math.min(...selectedProduct.malls.map(m => m.price)) : 0;
    const bestMall = selectedProduct ? selectedProduct.malls.find(m => m.price === minPrice) : null;

    const removeMall = (productId, mallIndex, e) => {
        e.stopPropagation();
        const updatedMalls = selectedProduct.malls.filter((_, idx) => idx !== mallIndex);
        const updatedProduct = { ...selectedProduct, malls: updatedMalls };
        const updatedProducts = products.map(p => p.id === productId ? updatedProduct : p);
        setProducts(updatedProducts);
        setSelectedProduct(updatedProduct);
        if (selectedMallIndex >= updatedMalls.length) {
            setSelectedMallIndex(Math.max(0, updatedMalls.length - 1));
        }
    };

    // Helper: Clean product title
    const cleanTitle = (title) => {
        return title.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\uFFFD/g, '');
    };

    return (
        <div className="container" style={{
            maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', height: '100vh', padding: isMobile ? '0.5rem' : '1.5rem', boxSizing: 'border-box', overflowX: 'hidden'
        }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'var(--text-primary)', color: 'white', padding: '10px', borderRadius: '10px', boxShadow: 'var(--shadow-sm)' }}>
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>AllTimePrice <span style={{ color: 'var(--accent-color)', fontWeight: 'normal' }}>Personal</span></h1>
                        {!isMobile && <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>실시간 최저가 추적 대시보드</p>}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {user ? (
                        <div
                            onClick={() => navigate('/profile')}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '6px 14px', borderRadius: '30px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-color)'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                            title="회원 정보 관리"
                        >
                            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--accent-color), #5856d6)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                                {user.email?.[0].toUpperCase() || 'U'}
                            </div>
                            {!isMobile && <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{user.email?.split('@')[0]}님</span>}
                            <button
                                onClick={(e) => { e.stopPropagation(); signOut(); }}
                                title="로그아웃"
                                style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger-color)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => navigate('/login')} className="btn" style={{ background: 'white', color: 'var(--text-primary)', border: '1px solid #ddd', padding: '8px 20px' }}>로그인</button>
                            <button onClick={() => navigate('/signup')} className="btn btn-primary" style={{ padding: '8px 20px' }}>회원가입</button>
                        </div>
                    )}
                </div>
            </header>

            {/* Notification Toast */}
            {notification && (
                <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', background: notification.type === 'success' ? 'rgba(52, 199, 89, 0.95)' : 'rgba(255, 59, 48, 0.95)', color: 'white', padding: '12px 24px', borderRadius: '40px', boxShadow: '0 8px 16px rgba(0,0,0,0.15)', zIndex: 9999, fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', backdropFilter: 'blur(8px)', animation: 'fadeInDown 0.3s ease-out' }}>
                    {notification.type === 'success' ? <CheckCircle size={20} /> : <Info size={20} />} {notification.message}
                </div>
            )}

            {/* Main Content Grid */}
            <div style={{ display: isPC ? 'grid' : (isTablet ? 'grid' : 'block'), gridTemplateColumns: isPC ? 'minmax(280px, 320px) 1fr minmax(280px, 320px)' : (isTablet ? 'minmax(260px, 300px) 1fr' : 'none'), gap: isMobile ? '0' : '1.5rem', flex: 1, minHeight: 0, overflow: 'hidden' }}>

                {/* LEFT COLUMN: Product List */}
                {(!isMobile || activeTab === 'interest') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', height: isMobile ? 'calc(100vh - 160px)' : '100%', overflow: 'hidden' }}>
                        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>나의 관심 상품</h3>
                                <span style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: 'bold', background: '#e1f0ff', padding: '2px 8px', borderRadius: '10px' }}>{products.length}</span>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    placeholder="새 상품 검색 (예: 에어팟 프로)"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleSearch}
                                    style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '10px', border: '1px solid #eee', fontSize: '14px', outline: 'none', background: '#f8f9fa', transition: 'all 0.2s' }}
                                />
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '2px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {products.length === 0 ? (
                                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#888', background: 'white', borderRadius: 'var(--radius)', border: '2px dashed #eee' }}>
                                    <ShoppingBag size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
                                    <p style={{ margin: 0, fontSize: '14px' }}>등록된 상품이 없습니다.<br />검색해서 추가해 보세요!</p>
                                </div>
                            ) : (
                                products.map(product => {
                                    const minPriceLocal = Math.min(...product.malls.map(m => m.price));
                                    const isTargetMet = product.targetPrice && minPriceLocal <= product.targetPrice;
                                    return (
                                        <div
                                            key={product.id}
                                            className="card"
                                            onClick={() => { setSelectedProduct(product); setIsEditingMemo(false); }}
                                            style={{
                                                padding: '14px',
                                                border: selectedProduct?.id === product.id ? '2px solid var(--accent-color)' : '1px solid transparent',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <div style={{ width: '40px', height: '40px', background: '#f0f0f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Store size={20} color="#666" />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                                                    {cleanTitle(product.name)}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '15px', fontWeight: '800', color: isTargetMet ? 'var(--success-color)' : 'var(--text-primary)' }}>
                                                        {minPriceLocal.toLocaleString()}원
                                                    </span>
                                                    {isTargetMet && <CheckCircle size={14} color="var(--success-color)" />}
                                                </div>
                                            </div>
                                            <ChevronRight size={18} color="#ccc" />
                                            {selectedProduct?.id === product.id && (
                                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--accent-color)' }} />
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* CENTER COLUMN: Analysis & Controls */}
                {(!isMobile || activeTab === 'analysis') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', overflowY: 'auto', padding: '2px' }}>
                        {selectedProduct ? (
                            <>
                                {/* Price Trend Chart Card */}
                                <div className="card" style={{ padding: '1.5rem', background: '#fff', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                        <div>
                                            <span style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Price Trend</span>
                                            <h2 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '800' }}>{cleanTitle(selectedProduct.name)}</h2>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '24px', fontWeight: '850', color: priceDiff < 0 ? 'var(--success-color)' : (priceDiff > 0 ? 'var(--danger-color)' : 'var(--text-primary)') }}>
                                                {currentPrice.toLocaleString()}원
                                            </div>
                                            <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', color: priceDiff < 0 ? 'var(--success-color)' : (priceDiff > 0 ? 'var(--danger-color)' : 'var(--text-secondary)') }}>
                                                {priceDiff < 0 ? <ArrowDown size={14} /> : (priceDiff > 0 ? <ArrowUp size={14} /> : <ChevronRight size={14} />)}
                                                {Math.abs(priceDiff).toLocaleString()}원 ({((Math.abs(priceDiff) / prevPrice) * 100).toFixed(1)}%)
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ height: '260px', width: '100%', marginTop: '10px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={histories}>
                                                <XAxis dataKey="date" hide />
                                                <YAxis domain={['auto', 'auto']} hide />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                                                    formatter={(value) => [`${value.toLocaleString()}원`, '가격']}
                                                />
                                                {targetPrice > 0 && (
                                                    <ReferenceLine y={targetPrice} stroke="var(--danger-color)" strokeDasharray="3 3" label={{ position: 'right', value: '목표가', fill: 'var(--danger-color)', fontSize: 10 }} />
                                                )}
                                                <Line
                                                    type="monotone"
                                                    dataKey="price"
                                                    stroke="var(--accent-color)"
                                                    strokeWidth={3}
                                                    dot={{ r: 4, fill: 'var(--accent-color)', strokeWidth: 2, stroke: '#fff' }}
                                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                                    animationDuration={1500}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid #f0f0f0', paddingTop: '1.5rem' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>최저가</div>
                                            <div style={{ fontWeight: '800', fontSize: '16px' }}>{minPrice.toLocaleString()}원</div>
                                        </div>
                                        <div style={{ textAlign: 'center', borderLeft: '1px solid #f0f0f0', borderRight: '1px solid #f0f0f0' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>최고가</div>
                                            <div style={{ fontWeight: '800', fontSize: '16px' }}>{Math.max(...selectedProduct.malls.map(m => m.price)).toLocaleString()}원</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>판매처</div>
                                            <div style={{ fontWeight: '800', fontSize: '16px' }}>{selectedProduct.malls.length}곳</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Controls Card */}
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                                    <div className="card" style={{ padding: '1.2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                            <Target size={18} color="var(--accent-color)" />
                                            <h3 style={{ margin: 0, fontSize: '15px' }}>목표 가격 설정</h3>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                type="number"
                                                placeholder="예: 450000"
                                                value={selectedProduct.targetPrice || ""}
                                                onChange={(e) => updateTargetPrice(selectedProduct.id, e.target.value)}
                                                style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px' }}
                                            />
                                            <div style={{ background: isGoodPrice ? 'var(--success-color)' : '#f0f0f5', color: isGoodPrice ? 'white' : '#666', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                                                {isGoodPrice ? "구매 적기!" : "대기 중"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card" style={{ padding: '1.2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                            <Bell size={18} color="var(--accent-color)" />
                                            <h3 style={{ margin: 0, fontSize: '15px' }}>알림 설정</h3>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div onClick={(e) => toggleAlertOption(selectedProduct.id, 'priceDrop', e)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}>
                                                <span style={{ fontSize: '13px' }}>가격 하락 시 알림</span>
                                                <div style={{ width: '36px', height: '20px', background: selectedProduct.alertOptions?.priceDrop ? 'var(--success-color)' : '#ccc', borderRadius: '10px', position: 'relative', transition: '0.3s' }}>
                                                    <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: selectedProduct.alertOptions?.priceDrop ? '18px' : '2px', transition: '0.3s' }} />
                                                </div>
                                            </div>
                                            <div onClick={(e) => toggleAlertOption(selectedProduct.id, 'targetReached', e)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}>
                                                <span style={{ fontSize: '13px' }}>목표가 도달 시 알림</span>
                                                <div style={{ width: '36px', height: '20px', background: selectedProduct.alertOptions?.targetReached ? 'var(--success-color)' : '#ccc', borderRadius: '10px', position: 'relative', transition: '0.3s' }}>
                                                    <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: selectedProduct.alertOptions?.targetReached ? '18px' : '2px', transition: '0.3s' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Memo Card */}
                                <div className="card" style={{ padding: '1.2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <StickyNote size={18} color="var(--accent-color)" />
                                            <h3 style={{ margin: 0, fontSize: '15px' }}>나의 메모</h3>
                                        </div>
                                        <button
                                            onClick={() => { if (isEditingMemo) updateMemo(selectedProduct.id, tempMemo); else setTempMemo(selectedProduct.memo || ""); setIsEditingMemo(!isEditingMemo); }}
                                            style={{ background: isEditingMemo ? 'var(--accent-color)' : 'none', color: isEditingMemo ? 'white' : 'var(--accent-color)', border: '1px solid var(--accent-color)', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                                        >
                                            {isEditingMemo ? '저장하기' : '수정'}
                                        </button>
                                    </div>
                                    {isEditingMemo ? (
                                        <textarea
                                            autoFocus
                                            value={tempMemo}
                                            onChange={e => setTempMemo(e.target.value)}
                                            style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', border: '1px solid var(--accent-color)', fontSize: '14px', outline: 'none', background: '#fff' }}
                                            placeholder="상품에 대한 메모를 남겨보세요."
                                        />
                                    ) : (
                                        <div style={{ fontSize: '14px', color: selectedProduct.memo ? 'var(--text-primary)' : '#aaa', fontStyle: selectedProduct.memo ? 'normal' : 'italic', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                            {selectedProduct.memo || "작성된 메모가 없습니다. '수정' 버튼을 눌러 메모를 추가해 보세요."}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={(e) => { if (confirm("정말 이 상품을 삭제하시겠습니까?")) removeProduct(selectedProduct.id, e); }}
                                    style={{ padding: '12px', background: '#fff', color: 'var(--danger-color)', border: '1px solid #ffebeb', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    <X size={16} /> 관심 상품에서 제거
                                </button>
                            </>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888', background: '#fff', borderRadius: 'var(--radius)', border: '1px solid #eee' }}>
                                <BarChart2 size={64} style={{ marginBottom: '1rem', opacity: 0.1 }} />
                                <h3 style={{ margin: 0 }}>상품을 선택해 주세요</h3>
                                <p style={{ fontSize: '14px', marginTop: '8px' }}>좌측 목록에서 분석할 상품을 선택하거나 신규로 검색해 보세요.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* RIGHT COLUMN: Mall Comparison */}
                {(!isMobile || activeTab === 'malls') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', overflowY: 'auto' }}>
                        <div className="card" style={{ padding: '1rem', flexShrink: 0 }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Repeat size={18} color="var(--accent-color)" /> 쇼핑몰별 가격 비교
                            </h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {selectedProduct?.malls.map((mall, idx) => (
                                <div
                                    key={idx}
                                    className="card"
                                    onClick={() => setSelectedMallIndex(idx)}
                                    style={{
                                        padding: '1rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px',
                                        border: selectedMallIndex === idx ? '2px solid var(--accent-color)' : '1px solid transparent',
                                        background: selectedMallIndex === idx ? '#f0f7ff' : '#fff',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{mall.name}</span>
                                            {mall.price === minPrice && (
                                                <span style={{ fontSize: '10px', background: 'var(--accent-color)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>최저가</span>
                                            )}
                                        </div>
                                        <div style={{ fontWeight: '850', fontSize: '16px', color: mall.price === minPrice ? 'var(--accent-color)' : 'var(--text-primary)' }}>
                                            {mall.price.toLocaleString()}원
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <a
                                            href={mall.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ flex: 1, textDecoration: 'none', background: 'var(--text-primary)', color: 'white', padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                        >
                                            이동하기 <ChevronRight size={14} />
                                        </a>
                                        {selectedProduct.malls.length > 1 && (
                                            <button
                                                onClick={(e) => removeMall(selectedProduct.id, idx, e)}
                                                style={{ width: '36px', background: '#f5f5f5', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#999' }}
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {selectedProduct && (
                            <div className="card" style={{ padding: '1rem', marginTop: 'auto', background: 'linear-gradient(135deg, #1d1d1f, #434343)', color: 'white' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    <Info size={18} color="rgba(255,255,255,0.6)" />
                                    <span style={{ fontSize: '13px', fontWeight: '600' }}>Tip</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)' }}>
                                    가장 저렴한 <b>{bestMall?.name}</b>에서 구매 시 최대 <b>{(Math.max(...selectedProduct.malls.map(m => m.price)) - minPrice).toLocaleString()}원</b>을 절약할 수 있습니다.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mobile Navigation Tab Bar */}
            {isMobile && (
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', background: 'rgba(255,255,255,0.9)', padding: '12px 10px 30px 10px', borderTop: '1px solid #eee', backdropFilter: 'blur(10px)', zIndex: 1000 }}>
                    <button
                        onClick={() => setActiveTab('interest')}
                        style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: activeTab === 'interest' ? 'var(--accent-color)' : '#999', fontSize: '11px', fontWeight: 'bold' }}
                    >
                        <List size={22} /> 관심 목록
                    </button>
                    <button
                        onClick={() => setActiveTab('analysis')}
                        style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: activeTab === 'analysis' ? 'var(--accent-color)' : '#999', fontSize: '11px', fontWeight: 'bold' }}
                    >
                        <BarChart2 size={22} /> 가격 분석
                    </button>
                    <button
                        onClick={() => setActiveTab('malls')}
                        style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: activeTab === 'malls' ? 'var(--accent-color)' : '#999', fontSize: '11px', fontWeight: 'bold' }}
                    >
                        <Repeat size={22} /> 몰 비교
                    </button>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
