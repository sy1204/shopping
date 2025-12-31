import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { ExternalLink, Bell, StickyNote, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ProductDetail = ({
    selectedProduct,
    user,
    onUpdateMemo,
    onUpdateTargetPrice,
    onToggleAlertOption,
    onUpdateCategory
}) => {
    // Local state for memo editing to keep it self-contained if possible, 
    // but the parent was managing it. Let's keep parent management for simplicity of data flow for now,
    // or better, make this component handle the UI state of editing.
    // Let's use internal state for the memo input text, but parent state for "is it open?".
    // Actually, looking at the code, Dashboard manages `isEditingMemo` and `tempMemo`.
    // I can refactor this to be cleaner: Component receives current memo, handles editing internally, and calls onSave.

    const [isEditingMemo, setIsEditingMemo] = React.useState(false);
    const [tempMemo, setTempMemo] = React.useState("");
    const fileInputRef = React.useRef(null);

    React.useEffect(() => {
        if (selectedProduct) {
            setTempMemo(selectedProduct.memo || "");
            setIsEditingMemo(false);
        }
    }, [selectedProduct]);

    if (!selectedProduct) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                상품을 선택하면 상세 정보가 표시됩니다.
            </div>
        );
    }

    const getPrimaryMallData = (product) => {
        if (!product || !product.malls || product.malls.length === 0) return null;
        return product.malls.reduce((prev, curr) => curr.price < prev.price ? curr : prev);
    };

    const primaryMallData = getPrimaryMallData(selectedProduct);
    const currentPrice = primaryMallData ? primaryMallData.price : 0;

    const handleSaveMemo = () => {
        onUpdateMemo(selectedProduct.id, tempMemo);
        setIsEditingMemo(false);
    };

    const handleEditMemo = () => {
        setTempMemo(selectedProduct.memo || "");
        setIsEditingMemo(true);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Simple check for size (e.g. limit to 1MB to avoid horrible performance)
        if (file.size > 1024 * 1024) {
            alert("이미지 크기가 1MB를 초과하여 첨부할 수 없습니다.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result;
            // Append markdown image syntax to the current cursor position or end
            setTempMemo(prev => prev + `\n\n![image](${base64String}) \n`);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>

            {/* 1. TOP SECTION: Product Info (Summary) */}
            <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '16px', background: 'white' }}>
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <div style={{ width: '100px', height: '100px', padding: '5px', border: '1px solid #eee', borderRadius: '12px', flexShrink: 0 }}>
                        <img src={selectedProduct.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ background: '#f3f4f6', color: '#666', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                                        {primaryMallData?.name || 'Unknown'}
                                    </span>
                                    <a href={primaryMallData?.url || '#'} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                        상품 보러가기 <ExternalLink size={12} />
                                    </a>
                                </div>
                                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111', margin: '4px 0', lineHeight: 1.3 }}>
                                    {selectedProduct.name}
                                </h2>
                            </div>

                            {/* Status Change Button */}
                            {onUpdateCategory && (
                                <button
                                    onClick={() => {
                                        const isManaged = selectedProduct.category === 'managed';
                                        onUpdateCategory(selectedProduct.id, isManaged ? 'review' : 'managed');
                                    }}
                                    style={{
                                        padding: '8px 16px', borderRadius: '8px',
                                        border: selectedProduct.category === 'managed' ? '1px solid #3b82f6' : '1px solid #d97706',
                                        background: selectedProduct.category === 'managed' ? '#eff6ff' : '#fffbeb',
                                        color: selectedProduct.category === 'managed' ? '#3b82f6' : '#d97706',
                                        fontSize: '13px', fontWeight: 'bold',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {selectedProduct.category === 'managed' ? '구매검토로 복귀' : '물품관리로 이동'}
                                </button>
                            )}
                        </div>

                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontSize: '28px', fontWeight: '800', color: '#111' }}>
                                {primaryMallData?.price.toLocaleString() || 0}
                            </span>
                            <span style={{ fontSize: '16px', color: '#666' }}>원</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. MIDDLE SECTION: Chart (Left) + Controls (Right) */}
            <div style={{ display: 'flex', gap: '1.5rem', minHeight: '320px' }}>
                {/* Left: Chart (Flex 2) */}
                <div style={{ flex: 2, background: '#fafafa', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#666', marginBottom: '1rem' }}>가격 변동 추이</div>
                    <div style={{ flex: 1, minHeight: 0, outline: 'none' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={primaryMallData?.histories || []} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                                <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11, fill: '#aaa' }}
                                    tickFormatter={(str) => str ? str.substring(5, 10) : ''}
                                    label={{ value: '날짜', position: 'insideBottomRight', offset: -5, fontSize: 12, fill: '#aaa' }}
                                />
                                <YAxis
                                    domain={['auto', 'auto']}
                                    orientation="left"
                                    tick={{ fontSize: 11, fill: '#aaa' }}
                                    label={{ value: '가격', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#aaa' }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(val) => [`${val.toLocaleString()} 원`, '가격']}
                                    labelFormatter={(label) => label ? label.substring(0, 10) : ''}
                                />
                                <ReferenceLine y={selectedProduct.targetPrice} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'right', value: '목표가', fill: '#10b981', fontSize: 12 }} />
                                <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right: Controls (Flex 1) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Target Price */}
                    <div style={{ flex: 1, padding: '1.5rem', border: '1px solid #f0f0f0', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'nowrap' }}>
                            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333', whiteSpace: 'nowrap' }}>목표 가격 설정</div>
                            <div style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                                현재가 대비 <span style={{ color: currentPrice <= selectedProduct.targetPrice ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                                    {currentPrice > 0 ? Math.round(((selectedProduct.targetPrice - currentPrice) / currentPrice) * 100) : 0}%
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                            <button
                                onClick={() => onUpdateTargetPrice(selectedProduct.targetPrice - 100)}
                                disabled={!user}
                                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #ddd', background: 'white', cursor: user ? 'pointer' : 'default', opacity: user ? 1 : 0.5 }}
                            >-</button>

                            <input
                                type="number"
                                value={selectedProduct.targetPrice}
                                onChange={(e) => onUpdateTargetPrice(e.target.value)}
                                disabled={!user}
                                style={{
                                    fontSize: '24px', fontWeight: 'bold', color: selectedProduct.targetPrice > 0 ? '#10b981' : '#ccc',
                                    border: 'none', background: 'transparent', width: '120px', textAlign: 'center',
                                    outline: 'none', borderBottom: user ? '1px dashed #ddd' : 'none'
                                }}
                            />

                            <button
                                onClick={() => onUpdateTargetPrice(selectedProduct.targetPrice + 100)}
                                disabled={!user}
                                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #ddd', background: 'white', cursor: user ? 'pointer' : 'default', opacity: user ? 1 : 0.5 }}
                            >+</button>
                        </div>
                    </div>

                    {/* Alarm Settings */}
                    <div style={{ flex: 1, padding: '1.5rem', border: '1px solid #f0f0f0', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Bell size={16} /> 알림 설정
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: user ? 'pointer' : 'default', opacity: user ? 1 : 0.5, whiteSpace: 'nowrap' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedProduct.alertOptions?.targetHit !== false}
                                    onChange={() => onToggleAlertOption('targetHit')}
                                    disabled={!user}
                                    style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }}
                                />
                                <span>목표가 도달 시 알림</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: user ? 'pointer' : 'default', opacity: user ? 1 : 0.5, whiteSpace: 'nowrap' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedProduct.alertOptions?.priceDrop !== false}
                                    onChange={() => onToggleAlertOption('priceDrop')}
                                    disabled={!user}
                                    style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }}
                                />
                                <span>가격 하락 시 알림 (전일 대비)</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. BOTTOM SECTION: Memo */}
            <div style={{ padding: '1.5rem', border: '1px solid #f0f0f0', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <StickyNote size={16} /> 나의 메모
                    </div>
                    {isEditingMemo ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                            <button
                                onClick={() => fileInputRef.current.click()}
                                style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', background: '#f3f4f6', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                <ImageIcon size={12} /> 사진추가
                            </button>
                            <button onClick={handleSaveMemo} style={{ fontSize: '12px', fontWeight: 'bold', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>저장</button>
                        </div>
                    ) : (
                        <button onClick={handleEditMemo} disabled={!user} style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: user ? 'pointer' : 'default', opacity: user ? 1 : 0.5 }}>수정</button>
                    )}
                </div>

                {isEditingMemo ? (
                    <textarea
                        value={tempMemo}
                        onChange={(e) => setTempMemo(e.target.value)}
                        style={{ width: '100%', minHeight: '120px', borderRadius: '8px', border: '1px solid #ddd', padding: '10px', resize: 'vertical', fontSize: '13px', fontFamily: 'inherit' }}
                        placeholder="상품에 대한 메모를 남겨보세요. 이미지도 붙여넣을 수 있습니다."
                    />
                ) : (
                    <div style={{ minHeight: '40px', fontSize: '13px', color: '#555', lineHeight: 1.6 }} className="markdown-preview">
                        <ReactMarkdown
                            urlTransform={uri => uri}
                            components={{
                                img: ({ node, ...props }) => <img style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '8px', border: '1px solid #eee' }} {...props} alt="memo-img" />
                            }}
                        >
                            {selectedProduct.memo || "메모가 없습니다."}
                        </ReactMarkdown>
                    </div>
                )}
            </div>

            {/* 4. BOTTOM SECTION: Product Description (Crawled) */}
            {selectedProduct.description && (
                <div style={{ padding: '1.5rem', border: '1px solid #f0f0f0', borderRadius: '16px', background: '#fafafa' }}>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📦 상품 설명 (크롤링)
                    </div>
                    <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {selectedProduct.description}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;
