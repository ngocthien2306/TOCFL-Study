import type { Word } from '../../types';
import { customPinyin, pinyin } from 'pinyin-pro';
import type { GuidedLevel, GuidedReadingArticle, GuidedReadingSegment } from './types';

interface DefaultArticleDefinition {
  id: string;
  title: string;
  level: GuidedLevel;
  topic: string;
  segments: GuidedReadingSegment[];
  words: string[];
}

const CREATED_AT = '2026-07-21T00:00:00.000Z';

customPinyin({
  幾瓶: 'jǐ píng',
  擦乾淨: 'cā gān jìng',
});

const DEFAULT_CONTINUATIONS: Record<string, { chinese: string; vietnamese: string }> = {
  'guided-default-a1-01': {
    chinese: '回家以後，我先洗菜，再把雞肉放進鍋子裡。朋友來的時候，也帶了一盒甜點和幾瓶飲料。我們先一起準備桌子，然後坐下來慢慢吃。吃完飯以後，小明洗碗，小美把桌子擦乾淨。大家還看了照片，聊到很晚才回家。我覺得和朋友一起做飯，比一個人吃飯有意思多了。',
    vietnamese: 'Về nhà tôi chuẩn bị bữa ăn; bạn bè mang món tráng miệng và đồ uống. Sau bữa tối mọi người cùng dọn dẹp, xem ảnh và trò chuyện vui vẻ.',
  },
  'guided-default-a1-02': {
    chinese: '第一堂課是八點開始，我通常會早十分鐘到教室。下課的時候，我和同學去外面喝水，也會問老師不懂的問題。中午吃完飯，我們在圖書館看書。下午有體育課，大家一起打球。回家以後，我先休息一下，再做今天的功課。晚上九點以前，我會準備好明天要帶的書和衣服。',
    vietnamese: 'Tôi đến lớp sớm, hỏi giáo viên khi chưa hiểu, đọc sách ở thư viện và học thể dục. Về nhà tôi làm bài rồi chuẩn bị đồ cho ngày hôm sau.',
  },
  'guided-default-a1-03': {
    chinese: '公園旁邊有一個小湖，湖裡有魚和幾隻白色的鳥。朋友帶了相機，所以我們拍了不少照片。中午，我們坐在樹下吃三明治和蘋果。後來有一個小孩找不到媽媽，我們陪他去問公園的工作人員。找到媽媽以後，他很高興地跟我們說謝謝。回家以前，我們約好下個星期再來走路。',
    vietnamese: 'Ở công viên chúng tôi ngắm hồ, chụp ảnh và ăn trưa dưới cây. Chúng tôi còn giúp một em nhỏ tìm mẹ rồi hẹn tuần sau quay lại.',
  },
  'guided-default-a2-01': {
    chinese: '賣菜的老闆認識我，看到我就笑著打招呼。他告訴我今天的番茄很好，也教我怎麼選甜的水果。我比較了兩家店的價錢，最後多買了一些橘子。市場中間還有人賣早餐，我坐下來喝了一杯豆漿。離開以前，我把買好的東西分開放，重的放下面，容易壞的放上面。這樣回到家時，水果還是很漂亮。',
    vietnamese: 'Người bán hướng dẫn tôi chọn rau quả; tôi so sánh giá, ăn sáng trong chợ rồi xếp đồ cẩn thận trước khi về.',
  },
  'guided-default-a2-02': {
    chinese: '中午，同事們帶我去公司附近吃飯，大家一邊吃一邊介紹自己。回到辦公室後，我收到第一個工作，需要整理客人的資料。我不懂一個表格怎麼填，就請旁邊的同事再說一次。他慢慢說明，還給我看以前的例子。下班以前，我把工作做完，也記下明天要注意的事情。雖然第一天有一點緊張，我還是很期待新的生活。',
    vietnamese: 'Đồng nghiệp đưa tôi đi ăn, rồi giúp tôi hoàn thành công việc đầu tiên. Dù hơi căng thẳng, tôi vẫn mong chờ cuộc sống mới.',
  },
  'guided-default-a2-03': {
    chinese: '醫生也問我最近是不是常常睡得太晚。我想了一下，發現自己每天晚上都看手機看到十二點。拿藥以後，我回家煮了一碗粥，吃完就上床休息。朋友知道我生病，傳訊息提醒我按時吃藥。第二天早上，我的頭已經不那麼痛了。這次的經驗讓我知道，工作再忙也要好好吃飯、睡覺和照顧自己。',
    vietnamese: 'Bác sĩ hỏi về thói quen ngủ muộn. Tôi về nhà uống thuốc, nghỉ ngơi và hôm sau đã đỡ hơn; từ đó chú ý chăm sóc bản thân.',
  },
  'guided-default-a3-01': {
    chinese: '看房子的時候，我也注意窗戶、洗衣機和附近的聲音。第二間房雖然不大，但是白天很亮，房東也願意讓我養一隻貓。從那裡走到公司大約十五分鐘，附近還有超市和公園。我回家算了每個月的生活費，覺得房租仍然可以接受。簽約以前，我請朋友陪我再看一次，也把水電費和修理問題問清楚。準備得越仔細，搬家以後越安心。',
    vietnamese: 'Tôi kiểm tra ánh sáng, tiếng ồn và tiện ích quanh nhà, tính chi phí rồi nhờ bạn xem lại trước khi ký hợp đồng.',
  },
  'guided-default-a3-02': {
    chinese: '第二天早上，我們租腳踏車到海邊，沿路看見很多老房子。當地朋友介紹一間小店，老闆用家裡傳下來的方法做點心。我們一邊吃，一邊聽他說這條街以前的故事。下午突然下雨，大家就在咖啡店整理照片和旅行筆記。這趟旅行沒有安排得很滿，反而有更多時間觀察城市。回臺北後，我還把照片送給一起旅行的朋友。',
    vietnamese: 'Chúng tôi đạp xe, nghe người địa phương kể chuyện phố cũ và trú mưa trong quán cà phê. Chuyến đi chậm giúp hiểu thành phố hơn.',
  },
  'guided-default-a3-03': {
    chinese: '除了讀和聽，我每週也找語言交換的朋友聊天。我會先準備一個主題，例如旅行、工作或最近看的電影。說錯的時候，朋友不會立刻打斷，而是等我說完再一起修改。週末我把本週的新詞做成小卡片，先看中文猜意思，再用每個詞造句。過一段時間，我發現自己不再那麼怕長文章，開口說話也更自然。找到適合自己的方法，比一次學很多更重要。',
    vietnamese: 'Tôi trò chuyện với bạn trao đổi ngôn ngữ, làm thẻ từ và đặt câu. Luyện đều đặn khiến tôi bớt sợ bài dài và nói tự nhiên hơn.',
  },
  'guided-default-a4-01': {
    chinese: '第一次收到的衣服大小不合，我才開始注意退貨規定。客服請我拍下商品照片，並在七天內寄回。雖然處理需要一些時間，但網站很快就換了正確的尺寸。後來我買東西時，會先讀其他人的使用經驗，也會確認賣家的評價。我不再只選最便宜的商品，而是考慮自己是否真的需要，以及能不能使用很久。方便的購物方式，也需要更仔細的判斷。',
    vietnamese: 'Sau lần phải đổi hàng, tôi học cách xem quy định trả hàng, đánh giá người bán và cân nhắc nhu cầu thay vì chỉ chọn giá rẻ.',
  },
  'guided-default-a4-02': {
    chinese: '活動結束後，社區主任準備茶和水果請大家休息。鄰居們討論下個月要不要在空地種一些蔬菜，也有人建議增加垃圾分類的說明。年輕人可以幫忙搬重物，年長的居民則分享照顧植物的經驗。大家把工作分配好，約定平常看到垃圾也順手處理。社區變乾淨只是第一步，更重要的是居民開始互相問候，遇到問題也願意一起想辦法。',
    vietnamese: 'Sau buổi dọn dẹp, cư dân bàn chuyện trồng rau và phân loại rác. Việc hợp tác còn giúp hàng xóm gần gũi và cùng giải quyết vấn đề.',
  },
  'guided-default-a4-03': {
    chinese: '為了不讓自己放棄，我把跑步時間寫進行事曆，也找朋友一起練習。下雨時，我們就在家做簡單的運動，不拿天氣當理由。每次跑完，我會記下時間和身體的感覺，不只注意速度。幾個月後，我可以輕鬆跑完五公里，晚上也睡得更好。我明白好習慣不是一天形成的，偶爾休息也沒有關係，只要下一次願意再開始。',
    vietnamese: 'Tôi ghi lịch, tập cùng bạn và theo dõi cảm giác cơ thể. Sau vài tháng tôi chạy được năm cây số và hiểu rằng thói quen cần thời gian.',
  },
  'guided-default-b1-01': {
    chinese: '在家工作也有需要注意的地方，例如家人可能不知道我正在開會。現在我會關上房門，並在桌上放一個請勿打擾的牌子。公司同事每天早上用十分鐘分享進度，有困難就提早提出來。重要的討論仍安排到辦公室進行，讓大家有機會面對面交換想法。這種混合方式保留了在家的安靜，也維持團隊的關係。只要清楚安排時間和溝通規則，就能發揮兩種工作方式的優點。',
    vietnamese: 'Tôi đặt quy tắc khi làm ở nhà, cập nhật tiến độ với đồng đội và dành thảo luận quan trọng cho văn phòng để cân bằng hai cách làm việc.',
  },
  'guided-default-b1-02': {
    chinese: '除了增加車輛，城市也開始改善腳踏車道和人行空間。住得不遠的人可以步行或騎車，不必每次都開車。公司若提供彈性的上班時間，也能減少大家同時出門造成的壓力。不過，新的政策必須考慮老人、兒童和行動不便者的需要。交通設計不只是讓人更快到達目的地，也應該讓每個人安全地使用街道。當選擇變多，城市的空氣和生活品質才有機會一起改善。',
    vietnamese: 'Thành phố cần thêm đường xe đạp, không gian đi bộ và giờ làm linh hoạt, đồng thời bảo đảm người già, trẻ em và người khuyết tật đi lại an toàn.',
  },
  'guided-default-b1-03': {
    chinese: '我剛到臺灣時，不習慣大家見面先問吃飯了沒有，後來才知道這是一種關心。有一次朋友沒有接受我的禮物，我以為他不喜歡，其實他只是習慣先客氣地拒絕。這些經驗提醒我，不能只用自己的文化解釋別人的行為。學習當地語言能幫助我們聽懂表面的意思，願意觀察和提問則能理解背後的想法。尊重差異不是放棄自己，而是讓彼此找到更舒服的交流方式。',
    vietnamese: 'Những hiểu lầm về lời chào và quà tặng dạy tôi không giải thích mọi hành vi bằng văn hóa của mình; quan sát và hỏi giúp giao tiếp tốt hơn.',
  },
  'guided-default-b2-01': {
    chinese: '面對一則令人驚訝的消息，我通常先查看發布日期，再找其他可靠來源。照片也可能經過修改，標題更常故意省略重要背景來吸引注意。如果內容只要求讀者生氣或立刻轉發，我會暫停一下，不讓情緒替自己做決定。學校和家庭都可以教人辨認資訊，而網路平台也應公開處理假消息的方法。保持懷疑不代表什麼都不相信，而是根據證據決定相信多少。',
    vietnamese: 'Tôi kiểm tra ngày, nguồn và bối cảnh trước tin gây sốc; hoài nghi hợp lý là quyết định mức độ tin dựa trên bằng chứng.',
  },
  'guided-default-b2-02': {
    chinese: '個人的選擇雖然有限，卻能影響商店提供什麼商品。當越多人選擇耐用、可以修理或包裝較少的產品，企業就會注意到新的需求。社區也可以共享不常使用的工具，避免每個家庭都購買一套。另一方面，大型產業造成的污染仍需要法律管理，不能把全部責任放在消費者身上。有效的環保行動應同時包括生活改變、公共政策和企業責任。',
    vietnamese: 'Lựa chọn cá nhân có thể tác động doanh nghiệp, nhưng bảo vệ môi trường hiệu quả cần kết hợp thay đổi lối sống, chính sách và trách nhiệm công ty.',
  },
  'guided-default-b2-03': {
    chinese: '我以前常把休息看成浪費時間，結果越忙越容易出錯。現在開始工作以前，我會先排出真正重要的三件事，完成一段後就離開座位活動幾分鐘。遇到無法控制的問題，我提醒自己把注意力放在能採取的下一步。如果焦慮持續很久，和專業人員談談並不是軟弱，而是主動保護健康。認識壓力的來源並建立支持網絡，才能在追求目標時不失去生活。',
    vietnamese: 'Tôi ưu tiên ba việc quan trọng, nghỉ ngắn và tập trung vào bước có thể làm. Khi lo âu kéo dài, tìm hỗ trợ chuyên môn là cách chủ động bảo vệ sức khỏe.',
  },
  'guided-default-c1-01': {
    chinese: '除了提供照顧服務，社會也需要重新思考退休與就業制度。許多健康的長者仍希望參與工作或社區活動，他們累積的知識不應被年齡標籤忽略。科技可以協助遠距醫療與安全管理，但不能取代人際陪伴。政策若只把高齡者視為負擔，就會錯過他們能帶來的價值。打造適合各年齡生活的環境，最終其實保障了每一個人的未來。',
    vietnamese: 'Xã hội cần suy nghĩ lại về nghỉ hưu, việc làm và vai trò của người cao tuổi; công nghệ hỗ trợ nhưng không thay thế sự đồng hành của con người.',
  },
  'guided-default-c1-02': {
    chinese: '因此，教師的角色可能從傳遞答案轉向設計問題、引導討論與建立信任。學生使用生成工具時，也必須說明資料來源並檢查結果，而不是直接交出看似完整的內容。學校若只禁止新科技，容易失去教導負責任使用的機會；若毫無限制地接受，也可能擴大資源差距。真正值得追求的不是讓機器完成更多作業，而是讓科技支持更深入、更公平且保有人性的學習。',
    vietnamese: 'Giáo viên sẽ thiên về đặt vấn đề và xây dựng niềm tin; trường học cần dạy cách dùng công nghệ có trách nhiệm để việc học sâu sắc, công bằng và nhân văn hơn.',
  },
};

const DEFAULT_DEFINITIONS: DefaultArticleDefinition[] = [
  {
    id: 'guided-default-a1-01', title: '朋友來我家', level: 'A1', topic: 'Bạn bè và bữa tối',
    words: ['今天', '朋友', '家', '吃', '買', '喜歡'],
    segments: [
      { chinese: '今天是星期六，我請兩位朋友來我家吃飯。', pinyin: 'Jīntiān shì xīngqíliù, wǒ qǐng liǎng wèi péngyǒu lái wǒ jiā chīfàn.', vietnamese: 'Hôm nay là thứ Bảy, tôi mời hai người bạn đến nhà ăn cơm.' },
      { chinese: '他們七點來，我先去買菜和水果。', pinyin: 'Tāmen qī diǎn lái, wǒ xiān qù mǎi cài hé shuǐguǒ.', vietnamese: 'Họ đến lúc bảy giờ, tôi đi mua thức ăn và trái cây trước.' },
      { chinese: '小美喜歡吃雞肉，小明喜歡吃麵。', pinyin: 'Xiǎoměi xǐhuān chī jīròu, Xiǎomíng xǐhuān chī miàn.', vietnamese: 'Tiểu Mỹ thích ăn thịt gà, Tiểu Minh thích ăn mì.' },
      { chinese: '大家一起吃飯、說話，都很高興。', pinyin: 'Dàjiā yìqǐ chīfàn, shuōhuà, dōu hěn gāoxìng.', vietnamese: 'Mọi người cùng ăn và trò chuyện, ai cũng rất vui.' },
    ],
  },
  {
    id: 'guided-default-a1-02', title: '我的上學日', level: 'A1', topic: 'Một ngày đi học',
    words: ['早上', '學校', '老師', '同學', '中午', '家'],
    segments: [
      { chinese: '我每天早上六點半起床，七點吃早飯。', pinyin: 'Wǒ měitiān zǎoshang liù diǎn bàn qǐchuáng, qī diǎn chī zǎofàn.', vietnamese: 'Mỗi sáng tôi thức dậy lúc sáu giờ rưỡi và ăn sáng lúc bảy giờ.' },
      { chinese: '七點半，我坐公車去學校。', pinyin: 'Qī diǎn bàn, wǒ zuò gōngchē qù xuéxiào.', vietnamese: 'Bảy giờ rưỡi, tôi đi xe buýt đến trường.' },
      { chinese: '老師教我們中文，同學們一起練習。', pinyin: 'Lǎoshī jiāo wǒmen Zhōngwén, tóngxuémen yìqǐ liànxí.', vietnamese: 'Giáo viên dạy chúng tôi tiếng Trung, các bạn cùng lớp luyện tập cùng nhau.' },
      { chinese: '中午我在學校吃飯，下午四點回家。', pinyin: 'Zhōngwǔ wǒ zài xuéxiào chīfàn, xiàwǔ sì diǎn huí jiā.', vietnamese: 'Buổi trưa tôi ăn ở trường, bốn giờ chiều về nhà.' },
    ],
  },
  {
    id: 'guided-default-a1-03', title: '週末去公園', level: 'A1', topic: 'Cuối tuần ở công viên',
    words: ['星期天', '公園', '天氣', '看', '小孩', '朋友'],
    segments: [
      { chinese: '星期天天氣很好，我和朋友去公園。', pinyin: 'Xīngqítiān tiānqì hěn hǎo, wǒ hé péngyǒu qù gōngyuán.', vietnamese: 'Chủ nhật thời tiết rất đẹp, tôi và bạn đi công viên.' },
      { chinese: '公園裡有很多人，也有很多小孩。', pinyin: 'Gōngyuán lǐ yǒu hěn duō rén, yě yǒu hěn duō xiǎohái.', vietnamese: 'Trong công viên có rất nhiều người và nhiều trẻ em.' },
      { chinese: '我們一邊走路，一邊看花和大樹。', pinyin: 'Wǒmen yìbiān zǒulù, yìbiān kàn huā hé dàshù.', vietnamese: 'Chúng tôi vừa đi bộ vừa ngắm hoa và cây lớn.' },
      { chinese: '下午我們喝茶，然後坐公車回家。', pinyin: 'Xiàwǔ wǒmen hē chá, ránhòu zuò gōngchē huí jiā.', vietnamese: 'Buổi chiều chúng tôi uống trà rồi đi xe buýt về nhà.' },
    ],
  },
  {
    id: 'guided-default-a2-01', title: '坐公車去市場', level: 'A2', topic: 'Đi chợ bằng xe buýt',
    words: ['公車', '水果', '便宜', '買', '菜', '附近'],
    segments: [
      { chinese: '我家附近有一個市場，坐公車只要十分鐘。', pinyin: 'Wǒ jiā fùjìn yǒu yí ge shìchǎng, zuò gōngchē zhǐ yào shí fēnzhōng.', vietnamese: 'Gần nhà tôi có một khu chợ, đi xe buýt chỉ mất mười phút.' },
      { chinese: '星期六早上，我帶著袋子去買菜。', pinyin: 'Xīngqíliù zǎoshang, wǒ dàizhe dàizi qù mǎi cài.', vietnamese: 'Sáng thứ Bảy, tôi mang túi đi mua thức ăn.' },
      { chinese: '市場裡的水果很新鮮，價錢也很便宜。', pinyin: 'Shìchǎng lǐ de shuǐguǒ hěn xīnxiān, jiàqián yě hěn piányí.', vietnamese: 'Trái cây trong chợ rất tươi và giá cũng rẻ.' },
      { chinese: '我買了青菜、雞蛋和香蕉，再坐公車回家。', pinyin: 'Wǒ mǎile qīngcài, jīdàn hé xiāngjiāo, zài zuò gōngchē huí jiā.', vietnamese: 'Tôi mua rau, trứng và chuối rồi đi xe buýt về nhà.' },
    ],
  },
  {
    id: 'guided-default-a2-02', title: '第一天上班', level: 'A2', topic: 'Ngày đầu đi làm',
    words: ['工作', '介紹', '問題', '公司', '同事', '幫忙'],
    segments: [
      { chinese: '今天是我到新公司工作的第一天。', pinyin: 'Jīntiān shì wǒ dào xīn gōngsī gōngzuò de dì yī tiān.', vietnamese: 'Hôm nay là ngày đầu tiên tôi làm việc ở công ty mới.' },
      { chinese: '老闆先介紹公司的環境和工作時間。', pinyin: 'Lǎobǎn xiān jièshào gōngsī de huánjìng hé gōngzuò shíjiān.', vietnamese: 'Sếp giới thiệu môi trường công ty và giờ làm trước.' },
      { chinese: '同事們都很親切，有問題可以問他們。', pinyin: 'Tóngshìmen dōu hěn qīnqiè, yǒu wèntí kěyǐ wèn tāmen.', vietnamese: 'Các đồng nghiệp đều thân thiện, có vấn đề gì tôi có thể hỏi họ.' },
      { chinese: '下午一位同事幫忙教我使用電腦。', pinyin: 'Xiàwǔ yí wèi tóngshì bāngmáng jiāo wǒ shǐyòng diànnǎo.', vietnamese: 'Buổi chiều một đồng nghiệp giúp dạy tôi sử dụng máy tính.' },
    ],
  },
  {
    id: 'guided-default-a2-03', title: '去看醫生', level: 'A2', topic: 'Sức khỏe và khám bệnh',
    words: ['身體', '醫生', '藥', '休息', '健康', '醫院'],
    segments: [
      { chinese: '昨天晚上我的身體不太舒服，頭也很痛。', pinyin: 'Zuótiān wǎnshang wǒ de shēntǐ bú tài shūfu, tóu yě hěn tòng.', vietnamese: 'Tối qua người tôi không khỏe lắm và đầu cũng rất đau.' },
      { chinese: '今天早上，我到醫院去看醫生。', pinyin: 'Jīntiān zǎoshang, wǒ dào yīyuàn qù kàn yīshēng.', vietnamese: 'Sáng nay tôi đến bệnh viện khám bác sĩ.' },
      { chinese: '醫生說我要吃藥、多喝水，也要早一點休息。', pinyin: 'Yīshēng shuō wǒ yào chī yào, duō hē shuǐ, yě yào zǎo yìdiǎn xiūxí.', vietnamese: 'Bác sĩ nói tôi phải uống thuốc, uống nhiều nước và nghỉ sớm hơn.' },
      { chinese: '健康很重要，所以我決定今天不去工作。', pinyin: 'Jiànkāng hěn zhòngyào, suǒyǐ wǒ juédìng jīntiān bú qù gōngzuò.', vietnamese: 'Sức khỏe rất quan trọng nên tôi quyết định hôm nay không đi làm.' },
    ],
  },
  {
    id: 'guided-default-a3-01', title: '找一個新房間', level: 'A3', topic: 'Thuê nhà và chuyển nhà',
    words: ['房租', '房間', '廚房', '附近', '方便', '搬家'],
    segments: [
      { chinese: '因為工作地點改了，我想搬家找一個新房間。', pinyin: 'Yīnwèi gōngzuò dìdiǎn gǎile, wǒ xiǎng bānjiā zhǎo yí ge xīn fángjiān.', vietnamese: 'Vì nơi làm việc thay đổi, tôi muốn chuyển nhà và tìm phòng mới.' },
      { chinese: '第一間房子的房租便宜，可是廚房太小。', pinyin: 'Dì yī jiān fángzi de fángzū piányí, kěshì chúfáng tài xiǎo.', vietnamese: 'Căn đầu tiên có tiền thuê rẻ nhưng nhà bếp quá nhỏ.' },
      { chinese: '第二間在捷運站附近，生活非常方便。', pinyin: 'Dì èr jiān zài jiéyùn zhàn fùjìn, shēnghuó fēicháng fāngbiàn.', vietnamese: 'Căn thứ hai gần ga tàu điện, sinh hoạt rất tiện lợi.' },
      { chinese: '雖然房租高一點，我還是決定下個月搬家。', pinyin: 'Suīrán fángzū gāo yìdiǎn, wǒ háishì juédìng xià ge yuè bānjiā.', vietnamese: 'Dù tiền thuê cao hơn một chút, tôi vẫn quyết định chuyển vào tháng sau.' },
    ],
  },
  {
    id: 'guided-default-a3-02', title: '臺南小旅行', level: 'A3', topic: 'Du lịch và văn hóa Đài Loan',
    words: ['旅行', '火車', '飯店', '小吃', '照片', '文化'],
    segments: [
      { chinese: '上個月我和朋友坐火車去臺南旅行。', pinyin: 'Shàng ge yuè wǒ hé péngyǒu zuò huǒchē qù Táinán lǚxíng.', vietnamese: 'Tháng trước tôi và bạn đi tàu hỏa du lịch Đài Nam.' },
      { chinese: '我們住在車站附近的飯店，走路很方便。', pinyin: 'Wǒmen zhù zài chēzhàn fùjìn de fàndiàn, zǒulù hěn fāngbiàn.', vietnamese: 'Chúng tôi ở khách sạn gần nhà ga nên đi bộ rất thuận tiện.' },
      { chinese: '白天我們參觀古蹟，也拍了很多照片。', pinyin: 'Báitiān wǒmen cānguān gǔjī, yě pāile hěn duō zhàopiàn.', vietnamese: 'Ban ngày chúng tôi tham quan di tích và chụp rất nhiều ảnh.' },
      { chinese: '晚上大家吃臺南小吃，更了解當地文化。', pinyin: 'Wǎnshang dàjiā chī Táinán xiǎochī, gèng liǎojiě dāngdì wénhuà.', vietnamese: 'Buổi tối mọi người ăn đặc sản Đài Nam và hiểu thêm văn hóa địa phương.' },
    ],
  },
  {
    id: 'guided-default-a3-03', title: '學中文的方法', level: 'A3', topic: 'Phương pháp học tiếng Trung',
    words: ['中文', '練習', '進步', '方法', '學習', '能力'],
    segments: [
      { chinese: '我學中文兩年了，最近想改變學習方法。', pinyin: 'Wǒ xué Zhōngwén liǎng nián le, zuìjìn xiǎng gǎibiàn xuéxí fāngfǎ.', vietnamese: 'Tôi học tiếng Trung hai năm rồi và gần đây muốn thay đổi phương pháp học.' },
      { chinese: '早上我讀一篇短文，晚上練習聽力。', pinyin: 'Zǎoshang wǒ dú yì piān duǎnwén, wǎnshang liànxí tīnglì.', vietnamese: 'Buổi sáng tôi đọc một bài ngắn, buổi tối luyện nghe.' },
      { chinese: '遇到不懂的詞，我會寫在筆記本裡。', pinyin: 'Yùdào bù dǒng de cí, wǒ huì xiě zài bǐjìběn lǐ.', vietnamese: 'Khi gặp từ không hiểu, tôi ghi vào sổ.' },
      { chinese: '每天練習一點，我的閱讀能力慢慢進步了。', pinyin: 'Měitiān liànxí yìdiǎn, wǒ de yuèdú nénglì mànmàn jìnbù le.', vietnamese: 'Luyện một chút mỗi ngày, khả năng đọc của tôi dần tiến bộ.' },
    ],
  },
  {
    id: 'guided-default-a4-01', title: '第一次網路購物', level: 'A4', topic: 'Mua sắm trực tuyến',
    words: ['網路', '商品', '網站', '信用卡', '品質', '購物'],
    segments: [
      { chinese: '我以前喜歡到商店買東西，最近開始在網路上購物。', pinyin: 'Wǒ yǐqián xǐhuān dào shāngdiàn mǎi dōngxi, zuìjìn kāishǐ zài wǎnglù shàng gòuwù.', vietnamese: 'Trước đây tôi thích đến cửa hàng mua đồ, gần đây bắt đầu mua trực tuyến.' },
      { chinese: '網站上的商品很多，也可以比較價錢和品質。', pinyin: 'Wǎngzhàn shàng de shāngpǐn hěn duō, yě kěyǐ bǐjiào jiàqián hé pǐnzhí.', vietnamese: 'Trên website có nhiều sản phẩm, cũng có thể so sánh giá và chất lượng.' },
      { chinese: '付款時，我使用信用卡，兩天後就收到包裹。', pinyin: 'Fùkuǎn shí, wǒ shǐyòng xìnyòngkǎ, liǎng tiān hòu jiù shōudào bāoguǒ.', vietnamese: 'Khi thanh toán tôi dùng thẻ tín dụng và hai ngày sau nhận được bưu kiện.' },
      { chinese: '不過，買以前還是要先看清楚商品說明。', pinyin: 'Búguò, mǎi yǐqián háishì yào xiān kàn qīngchu shāngpǐn shuōmíng.', vietnamese: 'Tuy vậy, trước khi mua vẫn phải đọc kỹ mô tả sản phẩm.' },
    ],
  },
  {
    id: 'guided-default-a4-02', title: '社區清潔日', level: 'A4', topic: 'Hoạt động cộng đồng',
    words: ['社區', '活動', '鄰居', '參加', '環境', '合作'],
    segments: [
      { chinese: '我們社區每個月都有一次清潔活動。', pinyin: 'Wǒmen shèqū měi ge yuè dōu yǒu yí cì qīngjié huódòng.', vietnamese: 'Khu dân cư của chúng tôi mỗi tháng đều có một buổi dọn vệ sinh.' },
      { chinese: '星期六早上，許多鄰居帶著工具來參加。', pinyin: 'Xīngqíliù zǎoshang, xǔduō línjū dàizhe gōngjù lái cānjiā.', vietnamese: 'Sáng thứ Bảy, nhiều hàng xóm mang dụng cụ đến tham gia.' },
      { chinese: '有人整理花園，有人把路上的垃圾撿起來。', pinyin: 'Yǒurén zhěnglǐ huāyuán, yǒurén bǎ lùshàng de lājī jiǎn qǐlái.', vietnamese: 'Có người dọn vườn, có người nhặt rác trên đường.' },
      { chinese: '大家一起合作，不但改善環境，也認識了新朋友。', pinyin: 'Dàjiā yìqǐ hézuò, búdàn gǎishàn huánjìng, yě rènshìle xīn péngyǒu.', vietnamese: 'Mọi người cùng hợp tác, vừa cải thiện môi trường vừa quen bạn mới.' },
    ],
  },
  {
    id: 'guided-default-a4-03', title: '養成運動習慣', level: 'A4', topic: 'Thói quen vận động',
    words: ['運動', '習慣', '跑步', '精神', '健康', '保持'],
    segments: [
      { chinese: '以前我下班後常常看電視，很少運動。', pinyin: 'Yǐqián wǒ xiàbān hòu chángcháng kàn diànshì, hěn shǎo yùndòng.', vietnamese: 'Trước đây sau giờ làm tôi thường xem TV và ít vận động.' },
      { chinese: '為了健康，我開始每週跑步三次。', pinyin: 'Wèile jiànkāng, wǒ kāishǐ měi zhōu pǎobù sān cì.', vietnamese: 'Vì sức khỏe, tôi bắt đầu chạy bộ ba lần mỗi tuần.' },
      { chinese: '剛開始很累，但是一個月後精神變得更好。', pinyin: 'Gāng kāishǐ hěn lèi, dànshì yí ge yuè hòu jīngshén biànde gèng hǎo.', vietnamese: 'Ban đầu rất mệt nhưng sau một tháng tinh thần tốt hơn.' },
      { chinese: '現在運動已經成為習慣，我希望一直保持下去。', pinyin: 'Xiànzài yùndòng yǐjīng chéngwéi xíguàn, wǒ xīwàng yìzhí bǎochí xiàqù.', vietnamese: 'Giờ vận động đã thành thói quen và tôi muốn duy trì mãi.' },
    ],
  },
  {
    id: 'guided-default-b1-01', title: '在家工作的選擇', level: 'B1', topic: 'Làm việc từ xa',
    words: ['工作', '效率', '溝通', '會議', '專心', '平衡'],
    segments: [
      { chinese: '公司讓員工每週選擇兩天在家工作。', pinyin: 'Gōngsī ràng yuángōng měi zhōu xuǎnzé liǎng tiān zài jiā gōngzuò.', vietnamese: 'Công ty cho nhân viên chọn hai ngày mỗi tuần làm ở nhà.' },
      { chinese: '少了通勤時間，我可以更專心，工作效率也提高了。', pinyin: 'Shǎole tōngqín shíjiān, wǒ kěyǐ gèng zhuānxīn, gōngzuò xiàolǜ yě tígāo le.', vietnamese: 'Bớt thời gian đi lại giúp tôi tập trung hơn và hiệu suất cũng tăng.' },
      { chinese: '不過，線上會議有時不容易溝通，需要把事情說清楚。', pinyin: 'Búguò, xiànshàng huìyì yǒushí bù róngyì gōutōng, xūyào bǎ shìqing shuō qīngchu.', vietnamese: 'Tuy nhiên họp trực tuyến đôi khi khó trao đổi nên cần nói rõ ràng.' },
      { chinese: '我安排固定的下班時間，努力保持工作與生活的平衡。', pinyin: 'Wǒ ānpái gùdìng de xiàbān shíjiān, nǔlì bǎochí gōngzuò yǔ shēnghuó de pínghéng.', vietnamese: 'Tôi sắp xếp giờ tan làm cố định để giữ cân bằng công việc và cuộc sống.' },
    ],
  },
  {
    id: 'guided-default-b1-02', title: '城市裡的交通', level: 'B1', topic: 'Giao thông công cộng',
    words: ['交通', '捷運', '塞車', '政府', '改善', '選擇'],
    segments: [
      { chinese: '城市人口增加以後，交通問題也越來越明顯。', pinyin: 'Chéngshì rénkǒu zēngjiā yǐhòu, jiāotōng wèntí yě yuèláiyuè míngxiǎn.', vietnamese: 'Sau khi dân số thành phố tăng, vấn đề giao thông ngày càng rõ.' },
      { chinese: '上下班時間常常塞車，開車的人需要花很多時間。', pinyin: 'Shàngxiàbān shíjiān chángcháng sāichē, kāichē de rén xūyào huā hěn duō shíjiān.', vietnamese: 'Giờ đi làm thường kẹt xe, người lái xe phải mất nhiều thời gian.' },
      { chinese: '政府增加公車路線，也改善捷運站附近的設計。', pinyin: 'Zhèngfǔ zēngjiā gōngchē lùxiàn, yě gǎishàn jiéyùn zhàn fùjìn de shèjì.', vietnamese: 'Chính phủ tăng tuyến xe buýt và cải thiện thiết kế quanh ga tàu điện.' },
      { chinese: '如果大眾運輸更方便，市民就會有更多選擇。', pinyin: 'Rúguǒ dàzhòng yùnshū gèng fāngbiàn, shìmín jiù huì yǒu gèng duō xuǎnzé.', vietnamese: 'Nếu giao thông công cộng thuận tiện hơn, người dân sẽ có nhiều lựa chọn.' },
    ],
  },
  {
    id: 'guided-default-b1-03', title: '理解文化差異', level: 'B1', topic: 'Khác biệt văn hóa',
    words: ['文化', '差異', '適應', '誤會', '經驗', '交流'],
    segments: [
      { chinese: '到另一個地方生活時，人們常會發現許多文化差異。', pinyin: 'Dào lìng yí ge dìfang shēnghuó shí, rénmen cháng huì fāxiàn xǔduō wénhuà chāyì.', vietnamese: 'Khi sống ở nơi khác, người ta thường nhận ra nhiều khác biệt văn hóa.' },
      { chinese: '有些習慣看起來很奇怪，其實只是生活方式不同。', pinyin: 'Yǒuxiē xíguàn kàn qǐlái hěn qíguài, qíshí zhǐshì shēnghuó fāngshì bùtóng.', vietnamese: 'Một số thói quen trông lạ nhưng thật ra chỉ là lối sống khác nhau.' },
      { chinese: '遇到誤會時，先詢問對方，比直接批評更有幫助。', pinyin: 'Yùdào wùhuì shí, xiān xúnwèn duìfāng, bǐ zhíjiē pīpíng gèng yǒu bāngzhù.', vietnamese: 'Khi có hiểu lầm, hỏi đối phương trước hữu ích hơn chỉ trích trực tiếp.' },
      { chinese: '透過交流和經驗，我們會慢慢適應並理解彼此。', pinyin: 'Tòuguò jiāoliú hé jīngyàn, wǒmen huì mànmàn shìyìng bìng lǐjiě bǐcǐ.', vietnamese: 'Qua giao lưu và trải nghiệm, chúng ta dần thích nghi và hiểu nhau.' },
    ],
  },
  {
    id: 'guided-default-b2-01', title: '面對網路資訊', level: 'B2', topic: 'Thông tin trên mạng xã hội',
    words: ['網路', '資訊', '影響', '判斷', '分享', '責任'],
    segments: [
      { chinese: '網路讓我們快速得到資訊，也改變了分享消息的方式。', pinyin: 'Wǎnglù ràng wǒmen kuàisù dédào zīxùn, yě gǎibiànle fēnxiǎng xiāoxi de fāngshì.', vietnamese: 'Internet giúp ta nhận thông tin nhanh và thay đổi cách chia sẻ tin tức.' },
      { chinese: '然而，內容傳得快，不代表每一則消息都正確。', pinyin: 'Ránér, nèiróng chuán de kuài, bù dàibiǎo měi yì zé xiāoxi dōu zhèngquè.', vietnamese: 'Tuy nhiên, nội dung lan nhanh không có nghĩa mọi tin đều đúng.' },
      { chinese: '閱讀時應該確認來源，並判斷作者是否提供足夠證據。', pinyin: 'Yuèdú shí yīnggāi quèrèn láiyuán, bìng pànduàn zuòzhě shìfǒu tígōng zúgòu zhèngjù.', vietnamese: 'Khi đọc nên kiểm tra nguồn và đánh giá tác giả có đủ bằng chứng không.' },
      { chinese: '每個人分享以前多想一下，就能減少錯誤資訊的影響。', pinyin: 'Měi ge rén fēnxiǎng yǐqián duō xiǎng yíxià, jiù néng jiǎnshǎo cuòwù zīxùn de yǐngxiǎng.', vietnamese: 'Nếu mỗi người nghĩ thêm trước khi chia sẻ, ta có thể giảm ảnh hưởng của tin sai.' },
      { chinese: '負責任地使用網路，是現代生活的重要能力。', pinyin: 'Fù zérèn de shǐyòng wǎnglù, shì xiàndài shēnghuó de zhòngyào nénglì.', vietnamese: 'Sử dụng internet có trách nhiệm là năng lực quan trọng trong đời sống hiện đại.' },
    ],
  },
  {
    id: 'guided-default-b2-02', title: '從生活開始環保', level: 'B2', topic: 'Bảo vệ môi trường',
    words: ['氣候', '環境', '資源', '浪費', '回收', '消費'],
    segments: [
      { chinese: '氣候變化與每個人的生活有關，環境問題不能只交給政府。', pinyin: 'Qìhòu biànhuà yǔ měi ge rén de shēnghuó yǒuguān, huánjìng wèntí bùnéng zhǐ jiāo gěi zhèngfǔ.', vietnamese: 'Biến đổi khí hậu liên quan đến mọi người; vấn đề môi trường không thể chỉ giao cho chính phủ.' },
      { chinese: '購物前先想清楚需要什麼，可以減少不必要的消費。', pinyin: 'Gòuwù qián xiān xiǎng qīngchu xūyào shénme, kěyǐ jiǎnshǎo bù bìyào de xiāofèi.', vietnamese: 'Suy nghĩ rõ nhu cầu trước khi mua giúp giảm tiêu dùng không cần thiết.' },
      { chinese: '自備杯子、重複使用袋子，也能避免浪費資源。', pinyin: 'Zìbèi bēizi, chóngfù shǐyòng dàizi, yě néng bìmiǎn làngfèi zīyuán.', vietnamese: 'Tự mang cốc và tái sử dụng túi cũng giúp tránh lãng phí tài nguyên.' },
      { chinese: '垃圾回收雖然只是小事，長期累積卻能帶來改變。', pinyin: 'Lājī huíshōu suīrán zhǐshì xiǎoshì, chángqí lěijī què néng dàilái gǎibiàn.', vietnamese: 'Tái chế rác tuy là việc nhỏ nhưng tích lũy lâu dài có thể tạo thay đổi.' },
      { chinese: '保護環境不一定很困難，重要的是願意持續行動。', pinyin: 'Bǎohù huánjìng bù yídìng hěn kùnnán, zhòngyào de shì yuànyì chíxù xíngdòng.', vietnamese: 'Bảo vệ môi trường không nhất thiết khó; điều quan trọng là sẵn lòng hành động lâu dài.' },
    ],
  },
  {
    id: 'guided-default-b2-03', title: '和壓力相處', level: 'B2', topic: 'Quản lý áp lực',
    words: ['壓力', '競爭', '目標', '情緒', '調整', '支持'],
    segments: [
      { chinese: '現代生活充滿競爭，工作和學習都可能帶來壓力。', pinyin: 'Xiàndài shēnghuó chōngmǎn jìngzhēng, gōngzuò hé xuéxí dōu kěnéng dàilái yālì.', vietnamese: 'Cuộc sống hiện đại đầy cạnh tranh; công việc và học tập đều có thể gây áp lực.' },
      { chinese: '適度的壓力能幫助我們專心，但太多會影響睡眠和情緒。', pinyin: 'Shìdù de yālì néng bāngzhù wǒmen zhuānxīn, dàn tài duō huì yǐngxiǎng shuìmián hé qíngxù.', vietnamese: 'Áp lực vừa phải giúp tập trung, nhưng quá nhiều ảnh hưởng giấc ngủ và cảm xúc.' },
      { chinese: '把大目標分成幾個小步驟，會比較容易開始行動。', pinyin: 'Bǎ dà mùbiāo fēnchéng jǐ ge xiǎo bùzhòu, huì bǐjiào róngyì kāishǐ xíngdòng.', vietnamese: 'Chia mục tiêu lớn thành các bước nhỏ sẽ dễ bắt đầu hơn.' },
      { chinese: '如果身體一直不舒服，就應該調整安排並向別人求助。', pinyin: 'Rúguǒ shēntǐ yìzhí bù shūfu, jiù yīnggāi tiáozhěng ānpái bìng xiàng biérén qiúzhù.', vietnamese: 'Nếu cơ thể liên tục khó chịu, nên điều chỉnh lịch và nhờ người khác giúp.' },
      { chinese: '家人與朋友的支持，也能讓我們更有力量面對困難。', pinyin: 'Jiārén yǔ péngyǒu de zhīchí, yě néng ràng wǒmen gèng yǒu lìliàng miànduì kùnnán.', vietnamese: 'Sự hỗ trợ của gia đình và bạn bè giúp ta có thêm sức mạnh đối diện khó khăn.' },
    ],
  },
  {
    id: 'guided-default-c1-01', title: '高齡社會的新課題', level: 'C1', topic: 'Xã hội già hóa',
    words: ['人口', '社會', '政策', '醫療', '照顧', '負擔', '世代'],
    segments: [
      { chinese: '隨著出生率下降與平均壽命延長，許多地區正快速進入高齡社會。', pinyin: 'Suízhe chūshēnglǜ xiàjiàng yǔ píngjūn shòumìng yáncháng, xǔduō dìqū zhèng kuàisù jìnrù gāolíng shèhuì.', vietnamese: 'Khi tỷ lệ sinh giảm và tuổi thọ trung bình tăng, nhiều nơi nhanh chóng bước vào xã hội già hóa.' },
      { chinese: '人口結構改變不只影響醫療需求，也會改變勞動市場與家庭生活。', pinyin: 'Rénkǒu jiégòu gǎibiàn bù zhǐ yǐngxiǎng yīliáo xūqiú, yě huì gǎibiàn láodòng shìchǎng yǔ jiātíng shēnghuó.', vietnamese: 'Thay đổi cơ cấu dân số không chỉ ảnh hưởng nhu cầu y tế mà còn thay đổi thị trường lao động và đời sống gia đình.' },
      { chinese: '當照顧責任集中在少數家人身上時，他們往往承受沉重的時間與經濟負擔。', pinyin: 'Dāng zhàogù zérèn jízhōng zài shǎoshù jiārén shēnshàng shí, tāmen wǎngwǎng chéngshòu chénzhòng de shíjiān yǔ jīngjì fùdān.', vietnamese: 'Khi trách nhiệm chăm sóc dồn lên một số ít người nhà, họ thường chịu gánh nặng thời gian và kinh tế.' },
      { chinese: '因此，公共政策應整合住宅、交通、醫療與長期照顧服務。', pinyin: 'Yīncǐ, gōnggòng zhèngcè yīng zhěnghé zhùzhái, jiāotōng, yīliáo yǔ chángqí zhàogù fúwù.', vietnamese: 'Vì vậy chính sách công nên tích hợp nhà ở, giao thông, y tế và dịch vụ chăm sóc dài hạn.' },
      { chinese: '如果不同世代能共同討論需求，高齡化也可能成為重新設計社會的機會。', pinyin: 'Rúguǒ bùtóng shìdài néng gòngtóng tǎolùn xūqiú, gāolínghuà yě kěnéng chéngwéi chóngxīn shèjì shèhuì de jīhuì.', vietnamese: 'Nếu các thế hệ cùng thảo luận nhu cầu, già hóa cũng có thể là cơ hội thiết kế lại xã hội.' },
    ],
  },
  {
    id: 'guided-default-c1-02', title: '科技如何改變學習', level: 'C1', topic: 'Công nghệ và giáo dục',
    words: ['科技', '教育', '學習', '創造', '取代', '能力', '倫理'],
    segments: [
      { chinese: '數位科技進入教育現場後，學生取得知識的方式變得更多元。', pinyin: 'Shùwèi kējì jìnrù jiàoyù xiànchǎng hòu, xuéshēng qǔdé zhīshì de fāngshì biànde gèng duōyuán.', vietnamese: 'Sau khi công nghệ số đi vào giáo dục, cách học sinh tiếp cận tri thức trở nên đa dạng hơn.' },
      { chinese: '系統可以依照個人程度提供練習，讓學習者立刻看見錯誤並調整方法。', pinyin: 'Xìtǒng kěyǐ yīzhào gèrén chéngdù tígōng liànxí, ràng xuéxízhě lìkè kànjiàn cuòwù bìng tiáozhěng fāngfǎ.', vietnamese: 'Hệ thống có thể cung cấp bài tập theo trình độ cá nhân, giúp người học thấy lỗi và điều chỉnh ngay.' },
      { chinese: '然而，工具能快速整理資訊，卻無法完全取代教師的觀察與理解。', pinyin: 'Ránér, gōngjù néng kuàisù zhěnglǐ zīxùn, què wúfǎ wánquán qǔdài jiàoshī de guānchá yǔ lǐjiě.', vietnamese: 'Tuy nhiên công cụ có thể tổng hợp thông tin nhanh nhưng không thể hoàn toàn thay thế quan sát và thấu hiểu của giáo viên.' },
      { chinese: '教育的目標不只是回答問題，更要培養判斷、合作與創造能力。', pinyin: 'Jiàoyù de mùbiāo bù zhǐshì huídá wèntí, gèng yào péiyǎng pànduàn, hézuò yǔ chuàngzào nénglì.', vietnamese: 'Mục tiêu giáo dục không chỉ là trả lời câu hỏi mà còn bồi dưỡng năng lực phán đoán, hợp tác và sáng tạo.' },
      { chinese: '面對新的科技，我們也必須持續討論資料使用、公平與倫理責任。', pinyin: 'Miànduì xīn de kējì, wǒmen yě bìxū chíxù tǎolùn zīliào shǐyòng, gōngpíng yǔ lúnlǐ zérèn.', vietnamese: 'Trước công nghệ mới, ta cũng phải tiếp tục thảo luận việc dùng dữ liệu, sự công bằng và trách nhiệm đạo đức.' },
    ],
  },
];

function variants(hanzi: string): string[] {
  return hanzi
    .split(/[/、]/)
    .map(item => item.replace(/[（(].*?[）)]/g, '').trim())
    .filter(Boolean);
}

export function buildDefaultGuidedArticles(vocabulary: Word[]): GuidedReadingArticle[] {
  const byVariant = new Map<string, Word>();
  vocabulary.forEach(word => variants(word.hanzi).forEach(variant => byVariant.set(variant, word)));

  return DEFAULT_DEFINITIONS.map(definition => {
    const continuation = DEFAULT_CONTINUATIONS[definition.id];
    const continuationSentences = continuation?.chinese
      .match(/[^。！？]+[。！？]?/g)
      ?.map(sentence => sentence.trim())
      .filter(Boolean) ?? [];
    const segments = continuation
      ? [...definition.segments, ...continuationSentences.map((chinese, index) => ({
        chinese,
        pinyin: pinyin(chinese, { toneType: 'symbol', type: 'string' }),
        vietnamese: index === 0 ? continuation.vietnamese : '',
      }))]
      : definition.segments;
    return {
    ...definition,
    segments,
    vocabulary: definition.words
      .map(hanzi => byVariant.get(hanzi))
      .filter((word): word is Word => Boolean(word))
      .map(word => ({
        hanzi: word.hanzi,
        pinyin: word.pinyin,
        meaning: word.meaning,
        pos: word.pos,
        level: word.level,
      })),
    createdAt: CREATED_AT,
    model: 'TOCFL Study',
  };
  });
}
