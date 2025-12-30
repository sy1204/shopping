export const MOCK_PRODUCTS = [
    {
        id: 1,
        name: "CJ 햇반 백미밥 210g 12개",
        code: "CJ-HB-21012",
        image: "https://img.danawa.com/prod_img/500000/073/151/img/1151073_1.jpg?shrink=330:*&_v=20230718121633",
        targetPrice: 11000,
        memo: "비상용으로 항상 2박스 이상 쟁여둘 것. 개당 1,000원 이하일 때 추천.",
        specs: [
            { label: "식품유형", value: "즉석조리식품(살균제품)" },
            { label: "원재료명", value: "쌀(국산), 쌀추출물" },
            { label: "영양성분", value: "315kcal (210g당), 탄수화물 70g, 당류 0g, 단백질 5g" },
            { label: "보관방법", value: "실온보관" },
            { label: "제조사", value: "씨제이제일제당" },
            { label: "더미정보 1", value: "상세 테스트를 위한 긴 텍스트 데이터 1입니다." },
            { label: "더미정보 2", value: "상세 테스트를 위한 긴 텍스트 데이터 2입니다." },
            { label: "더미정보 3", value: "상세 테스트를 위한 긴 텍스트 데이터 3입니다." },
            { label: "더미정보 4", value: "상세 테스트를 위한 긴 텍스트 데이터 4입니다." },
            { label: "더미정보 5", value: "상세 테스트를 위한 긴 텍스트 데이터 5입니다." },
            { label: "더미정보 6", value: "상세 테스트를 위한 긴 텍스트 데이터 6입니다." },
            { label: "더미정보 7", value: "상세 테스트를 위한 긴 텍스트 데이터 7입니다." },
            { label: "더미정보 8", value: "상세 테스트를 위한 긴 텍스트 데이터 8입니다." },
            { label: "더미정보 9", value: "상세 테스트를 위한 긴 텍스트 데이터 9입니다." },
            { label: "더미정보 10", value: "상세 테스트를 위한 긴 텍스트 데이터 10입니다." }
        ],
        alertOptions: { lowestPrice: true, targetPrice: true },
        malls: [
            {
                name: "Coupang",
                price: 11950,
                url: "#",
                histories: [
                    { date: "2024-11-20", price: 12500 },
                    { date: "2024-12-01", price: 11800 },
                    { date: "2024-12-15", price: 12200 },
                    { date: "2024-12-25", price: 11950 }
                ]
            },
            {
                name: "Naver Shopping",
                price: 11500,
                url: "#",
                histories: [
                    { date: "2024-11-20", price: 12000 },
                    { date: "2024-12-01", price: 11500 },
                    { date: "2024-12-15", price: 11700 },
                    { date: "2024-12-25", price: 11500 }
                ]
            },
            {
                name: "Gmarket",
                price: 12600,
                url: "#",
                histories: [
                    { date: "2024-11-20", price: 12800 },
                    { date: "2024-12-01", price: 12400 },
                    { date: "2024-12-15", price: 12600 },
                    { date: "2024-12-25", price: 12600 }
                ]
            }
        ]
    },
    {
        id: 2,
        name: "농심 신라면 120g 5개입",
        code: "NS-SR-12005",
        image: "https://img.danawa.com/prod_img/500000/221/319/img/319221_1.jpg?shrink=330:*&_v=20230718121633",
        targetPrice: 3800,
        memo: "야식 1순위.",
        specs: [
            { label: "식품유형", value: "유탕면" },
            { label: "원재료", value: "소맥분, 팜유" }
        ],
        alertOptions: { lowestPrice: false, targetPrice: true },
        malls: [
            { name: "Coupang", price: 3900, url: "#", histories: [{ date: "2024-12-25", price: 3900 }] },
            { name: "Naver Shopping", price: 4100, url: "#", histories: [{ date: "2024-12-25", price: 4100 }] }
        ]
    },
    {
        id: 3,
        name: "삼다수 2L 12병",
        code: "SD-2L-12",
        image: "https://img.danawa.com/prod_img/500000/806/331/img/1331806_1.jpg?shrink=330:*&_v=20230718121633",
        targetPrice: 9000,
        specs: [{ label: "종류", value: "먹는샘물" }],
        malls: [{ name: "Naver Shopping", price: 9500, url: "#", histories: [{ date: "2024-12-25", price: 9500 }] }]
    },
    {
        id: 4,
        name: "맥심 모카골드 100T",
        code: "MX-MG-100",
        image: "https://via.placeholder.com/300?text=Coffee",
        targetPrice: 12000,
        specs: [{ label: "유형", value: "커피믹스" }],
        malls: [{ name: "Naver Shopping", price: 13000, url: "#", histories: [{ date: "2024-12-25", price: 13000 }] }]
    },
    {
        id: 5,
        name: "코카콜라 355ml 24캔",
        code: "CC-355-24",
        image: "https://via.placeholder.com/300?text=Coke",
        targetPrice: 18000,
        specs: [{ label: "유형", value: "탄산음료" }],
        malls: [{ name: "Coupang", price: 19500, url: "#", histories: [{ date: "2024-12-25", price: 19500 }] }]
    }
];
