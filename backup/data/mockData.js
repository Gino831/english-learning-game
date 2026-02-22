// 單字庫與文法庫 - 適合國小四年級程度
const mockData = {
    vocabulary: [
        // ===== Unit 1 - 動物 =====
        { id: 1, word: "Elephant", chinese: "大象", image: "🐘", unit: "Unit 1 動物", type: "choice", question: "'Elephant' 的中文意思是什麼？", options: ["大象", "老虎", "獅子", "猴子"], correctAnswer: "大象" },
        { id: 2, word: "Tiger", chinese: "老虎", image: "🐯", unit: "Unit 1 動物", type: "choice", question: "'Tiger' 的中文意思是什麼？", options: ["獅子", "老虎", "豹", "熊"], correctAnswer: "老虎" },
        { id: 3, word: "Lion", chinese: "獅子", image: "🦁", unit: "Unit 1 動物", type: "choice", question: "'Lion' 的中文意思是什麼？", options: ["猴子", "大象", "獅子", "狗"], correctAnswer: "獅子" },
        { id: 4, word: "Monkey", chinese: "猴子", image: "🐵", unit: "Unit 1 動物", type: "choice", question: "'Monkey' 的中文意思是什麼？", options: ["貓", "猴子", "鳥", "魚"], correctAnswer: "猴子" },
        { id: 5, word: "Rabbit", chinese: "兔子", image: "🐰", unit: "Unit 1 動物", type: "choice", question: "'Rabbit' 的中文意思是什麼？", options: ["松鼠", "兔子", "老鼠", "青蛙"], correctAnswer: "兔子" },
        { id: 6, word: "Bird", chinese: "鳥", image: "🐦", unit: "Unit 1 動物", type: "choice", question: "在天空飛的動物叫什麼？", options: ["Fish", "Bird", "Dog", "Cat"], correctAnswer: "Bird" },
        { id: 7, word: "Fish", chinese: "魚", image: "🐟", unit: "Unit 1 動物", type: "choice", question: "在水裡游泳的動物叫什麼？", options: ["Bird", "Cat", "Fish", "Dog"], correctAnswer: "Fish" },
        { id: 8, word: "Dog", chinese: "狗", image: "🐶", unit: "Unit 1 動物", type: "choice", question: "人類最好的朋友是什麼動物？", options: ["Cat", "Dog", "Bird", "Fish"], correctAnswer: "Dog" },
        { id: 9, word: "Cat", chinese: "貓", image: "🐱", unit: "Unit 1 動物", type: "choice", question: "'Cat' 的中文意思是什麼？", options: ["狗", "貓", "鳥", "魚"], correctAnswer: "貓" },
        { id: 10, word: "Bear", chinese: "熊", image: "🐻", unit: "Unit 1 動物", type: "choice", question: "'Bear' 的中文意思是什麼？", options: ["鹿", "熊", "狼", "狐狸"], correctAnswer: "熊" },

        // ===== Unit 2 - 食物 =====
        { id: 11, word: "Apple", chinese: "蘋果", image: "🍎", unit: "Unit 2 食物", type: "choice", question: "紅色的水果，一天一個可以遠離醫生？", options: ["Banana", "Apple", "Orange", "Grape"], correctAnswer: "Apple" },
        { id: 12, word: "Banana", chinese: "香蕉", image: "🍌", unit: "Unit 2 食物", type: "choice", question: "黃色彎彎的水果叫什麼？", options: ["Apple", "Banana", "Lemon", "Mango"], correctAnswer: "Banana" },
        { id: 13, word: "Rice", chinese: "米飯", image: "🍚", unit: "Unit 2 食物", type: "choice", question: "亞洲人的主食是什麼？", options: ["Bread", "Rice", "Noodle", "Cake"], correctAnswer: "Rice" },
        { id: 14, word: "Bread", chinese: "麵包", image: "🍞", unit: "Unit 2 食物", type: "choice", question: "'Bread' 的中文意思是什麼？", options: ["蛋糕", "麵包", "餅乾", "派"], correctAnswer: "麵包" },
        { id: 15, word: "Milk", chinese: "牛奶", image: "🥛", unit: "Unit 2 食物", type: "choice", question: "白色的飲料，可以幫助骨頭生長？", options: ["Juice", "Water", "Milk", "Tea"], correctAnswer: "Milk" },
        { id: 16, word: "Egg", chinese: "蛋", image: "🥚", unit: "Unit 2 食物", type: "choice", question: "雞媽媽生出來的叫什麼？", options: ["Egg", "Milk", "Bread", "Cake"], correctAnswer: "Egg" },
        { id: 17, word: "Cake", chinese: "蛋糕", image: "🎂", unit: "Unit 2 食物", type: "choice", question: "生日時會吃的甜點是什麼？", options: ["Bread", "Cookie", "Cake", "Pie"], correctAnswer: "Cake" },
        { id: 18, word: "Noodle", chinese: "麵條", image: "🍜", unit: "Unit 2 食物", type: "choice", question: "'Noodle' 的中文意思是什麼？", options: ["米飯", "麵條", "包子", "餃子"], correctAnswer: "麵條" },
        { id: 19, word: "Juice", chinese: "果汁", image: "🧃", unit: "Unit 2 食物", type: "choice", question: "水果榨出來的飲料叫什麼？", options: ["Water", "Milk", "Juice", "Tea"], correctAnswer: "Juice" },
        { id: 20, word: "Delicious", chinese: "美味的", image: "😋", unit: "Unit 2 食物", type: "choice", question: "形容食物非常好吃的英文是什麼？", options: ["Disgusting", "Delicious", "Dangerous", "Difficult"], correctAnswer: "Delicious" },

        // ===== Unit 3 - 學校 =====
        { id: 21, word: "Teacher", chinese: "老師", image: "👩‍🏫", unit: "Unit 3 學校", type: "choice", question: "在學校教你知識的人叫什麼？", options: ["Student", "Teacher", "Doctor", "Driver"], correctAnswer: "Teacher" },
        { id: 22, word: "Student", chinese: "學生", image: "🧑‍🎓", unit: "Unit 3 學校", type: "choice", question: "在學校學習的人叫什麼？", options: ["Teacher", "Student", "Nurse", "Cook"], correctAnswer: "Student" },
        { id: 23, word: "Book", chinese: "書", image: "📖", unit: "Unit 3 學校", type: "choice", question: "'Book' 的中文意思是什麼？", options: ["筆", "書", "尺", "橡皮擦"], correctAnswer: "書" },
        { id: 24, word: "Pencil", chinese: "鉛筆", image: "✏️", unit: "Unit 3 學校", type: "choice", question: "用來寫字的工具叫什麼？", options: ["Ruler", "Pencil", "Eraser", "Pen"], correctAnswer: "Pencil" },
        { id: 25, word: "Eraser", chinese: "橡皮擦", image: "🧹", unit: "Unit 3 學校", type: "choice", question: "擦掉鉛筆字的工具叫什麼？", options: ["Pencil", "Ruler", "Eraser", "Pen"], correctAnswer: "Eraser" },
        { id: 26, word: "Library", chinese: "圖書館", image: "📚", unit: "Unit 3 學校", type: "choice", question: "你去哪裡借書？", options: ["Park", "Library", "Supermarket", "Hospital"], correctAnswer: "Library" },
        { id: 27, word: "Classroom", chinese: "教室", image: "🏫", unit: "Unit 3 學校", type: "choice", question: "上課的地方叫什麼？", options: ["Bedroom", "Classroom", "Kitchen", "Bathroom"], correctAnswer: "Classroom" },
        { id: 28, word: "Homework", chinese: "功課", image: "📝", unit: "Unit 3 學校", type: "choice", question: "回家要做的作業叫什麼？", options: ["Housework", "Homework", "Teamwork", "Artwork"], correctAnswer: "Homework" },

        // ===== Unit 4 - 家庭 =====
        { id: 29, word: "Mother", chinese: "媽媽", image: "👩", unit: "Unit 4 家庭", type: "choice", question: "'Mother' 的中文意思是什麼？", options: ["爸爸", "媽媽", "姊姊", "哥哥"], correctAnswer: "媽媽" },
        { id: 30, word: "Father", chinese: "爸爸", image: "👨", unit: "Unit 4 家庭", type: "choice", question: "'Father' 的中文意思是什麼？", options: ["媽媽", "爸爸", "弟弟", "妹妹"], correctAnswer: "爸爸" },
        { id: 31, word: "Brother", chinese: "兄弟", image: "👦", unit: "Unit 4 家庭", type: "choice", question: "'Brother' 的中文意思是什麼？", options: ["姊妹", "兄弟", "叔叔", "阿姨"], correctAnswer: "兄弟" },
        { id: 32, word: "Sister", chinese: "姊妹", image: "👧", unit: "Unit 4 家庭", type: "choice", question: "'Sister' 的中文意思是什麼？", options: ["兄弟", "姊妹", "媽媽", "爸爸"], correctAnswer: "姊妹" },
        { id: 33, word: "Family", chinese: "家庭", image: "👨‍👩‍👧‍👦", unit: "Unit 4 家庭", type: "choice", question: "爸爸、媽媽和小孩組成的是什麼？", options: ["School", "Family", "Team", "Group"], correctAnswer: "Family" },
        { id: 34, word: "Baby", chinese: "嬰兒", image: "👶", unit: "Unit 4 家庭", type: "choice", question: "剛出生的小孩叫什麼？", options: ["Boy", "Girl", "Baby", "Kid"], correctAnswer: "Baby" },

        // ===== Unit 5 - 身體 =====
        { id: 35, word: "Head", chinese: "頭", image: "🗣️", unit: "Unit 5 身體", type: "choice", question: "身體最上面的部位叫什麼？", options: ["Hand", "Head", "Heart", "Hair"], correctAnswer: "Head" },
        { id: 36, word: "Hand", chinese: "手", image: "✋", unit: "Unit 5 身體", type: "choice", question: "用來抓東西的部位叫什麼？", options: ["Foot", "Hand", "Head", "Leg"], correctAnswer: "Hand" },
        { id: 37, word: "Eye", chinese: "眼睛", image: "👁️", unit: "Unit 5 身體", type: "choice", question: "用來看東西的器官叫什麼？", options: ["Ear", "Eye", "Nose", "Mouth"], correctAnswer: "Eye" },
        { id: 38, word: "Ear", chinese: "耳朵", image: "👂", unit: "Unit 5 身體", type: "choice", question: "用來聽聲音的器官叫什麼？", options: ["Eye", "Nose", "Ear", "Mouth"], correctAnswer: "Ear" },
        { id: 39, word: "Mouth", chinese: "嘴巴", image: "👄", unit: "Unit 5 身體", type: "choice", question: "用來吃東西和說話的器官叫什麼？", options: ["Nose", "Eye", "Ear", "Mouth"], correctAnswer: "Mouth" },
        { id: 40, word: "Nose", chinese: "鼻子", image: "👃", unit: "Unit 5 身體", type: "choice", question: "用來聞味道的器官叫什麼？", options: ["Mouth", "Nose", "Eye", "Ear"], correctAnswer: "Nose" },

        // ===== Unit 6 - 顏色 =====
        { id: 41, word: "Red", chinese: "紅色", image: "🔴", unit: "Unit 6 顏色", type: "choice", question: "蘋果和草莓是什麼顏色？", options: ["Blue", "Red", "Green", "Yellow"], correctAnswer: "Red" },
        { id: 42, word: "Blue", chinese: "藍色", image: "🔵", unit: "Unit 6 顏色", type: "choice", question: "天空和大海是什麼顏色？", options: ["Red", "Blue", "Green", "Yellow"], correctAnswer: "Blue" },
        { id: 43, word: "Green", chinese: "綠色", image: "🟢", unit: "Unit 6 顏色", type: "choice", question: "草地和樹葉是什麼顏色？", options: ["Red", "Blue", "Green", "Yellow"], correctAnswer: "Green" },
        { id: 44, word: "Yellow", chinese: "黃色", image: "🟡", unit: "Unit 6 顏色", type: "choice", question: "香蕉和太陽是什麼顏色？", options: ["Red", "Blue", "Green", "Yellow"], correctAnswer: "Yellow" },
        { id: 45, word: "Black", chinese: "黑色", image: "⚫", unit: "Unit 6 顏色", type: "choice", question: "夜晚的天空是什麼顏色？", options: ["White", "Black", "Gray", "Brown"], correctAnswer: "Black" },
        { id: 46, word: "White", chinese: "白色", image: "⚪", unit: "Unit 6 顏色", type: "choice", question: "雪和雲是什麼顏色？", options: ["Black", "White", "Gray", "Blue"], correctAnswer: "White" },
        { id: 47, word: "Pink", chinese: "粉紅色", image: "🩷", unit: "Unit 6 顏色", type: "choice", question: "櫻花是什麼顏色？", options: ["Red", "Purple", "Pink", "Orange"], correctAnswer: "Pink" },
        { id: 48, word: "Orange", chinese: "橘色", image: "🟠", unit: "Unit 6 顏色", type: "choice", question: "柳丁和胡蘿蔔是什麼顏色？", options: ["Red", "Yellow", "Orange", "Brown"], correctAnswer: "Orange" },

        // ===== Unit 7 - 數字 =====
        { id: 49, word: "One", chinese: "一", image: "1️⃣", unit: "Unit 7 數字", type: "choice", question: "數字 1 的英文是什麼？", options: ["One", "Two", "Three", "Ten"], correctAnswer: "One" },
        { id: 50, word: "Five", chinese: "五", image: "5️⃣", unit: "Unit 7 數字", type: "choice", question: "數字 5 的英文是什麼？", options: ["Four", "Five", "Six", "Seven"], correctAnswer: "Five" },
        { id: 51, word: "Ten", chinese: "十", image: "🔟", unit: "Unit 7 數字", type: "choice", question: "數字 10 的英文是什麼？", options: ["Nine", "Ten", "Eleven", "Twelve"], correctAnswer: "Ten" },
        { id: 52, word: "Twenty", chinese: "二十", image: "2️⃣0️⃣", unit: "Unit 7 數字", type: "choice", question: "數字 20 的英文是什麼？", options: ["Twelve", "Thirty", "Twenty", "Fifteen"], correctAnswer: "Twenty" },
        { id: 53, word: "Hundred", chinese: "一百", image: "💯", unit: "Unit 7 數字", type: "choice", question: "數字 100 的英文是什麼？", options: ["Ten", "Thousand", "Hundred", "Million"], correctAnswer: "Hundred" },

        // ===== Unit 8 - 天氣 & 自然 =====
        { id: 54, word: "Sunny", chinese: "晴天的", image: "☀️", unit: "Unit 8 天氣", type: "choice", question: "太陽出來了，天氣叫什麼？", options: ["Rainy", "Sunny", "Cloudy", "Windy"], correctAnswer: "Sunny" },
        { id: 55, word: "Rainy", chinese: "下雨的", image: "🌧️", unit: "Unit 8 天氣", type: "choice", question: "需要帶傘出門，因為天氣是？", options: ["Sunny", "Rainy", "Snowy", "Windy"], correctAnswer: "Rainy" },
        { id: 56, word: "Cloudy", chinese: "多雲的", image: "☁️", unit: "Unit 8 天氣", type: "choice", question: "天空有很多雲，天氣叫什麼？", options: ["Sunny", "Rainy", "Cloudy", "Hot"], correctAnswer: "Cloudy" },
        { id: 57, word: "Cold", chinese: "冷的", image: "🥶", unit: "Unit 8 天氣", type: "choice", question: "冬天很 _____，要穿厚外套。", options: ["Hot", "Cold", "Warm", "Cool"], correctAnswer: "Cold" },
        { id: 58, word: "Hot", chinese: "熱的", image: "🥵", unit: "Unit 8 天氣", type: "choice", question: "夏天很 _____，要多喝水。", options: ["Cold", "Hot", "Warm", "Cool"], correctAnswer: "Hot" },
        { id: 59, word: "Umbrella", chinese: "雨傘", image: "☂️", unit: "Unit 8 天氣", type: "choice", question: "下雨時用來擋雨的工具叫什麼？", options: ["Sunglasses", "Umbrella", "Hat", "Gloves"], correctAnswer: "Umbrella" },
        { id: 60, word: "Rainbow", chinese: "彩虹", image: "🌈", unit: "Unit 8 天氣", type: "choice", question: "雨後天空出現的七彩弧形叫什麼？", options: ["Sun", "Rainbow", "Cloud", "Star"], correctAnswer: "Rainbow" },

        // ===== Unit 9 - 時間 =====
        { id: 61, word: "Today", chinese: "今天", image: "📆", unit: "Unit 9 時間", type: "choice", question: "'Today' 的中文意思是什麼？", options: ["昨天", "今天", "明天", "週末"], correctAnswer: "今天" },
        { id: 62, word: "Yesterday", chinese: "昨天", image: "📅", unit: "Unit 9 時間", type: "choice", question: "今天的前一天叫什麼？", options: ["Tomorrow", "Yesterday", "Tonight", "Weekend"], correctAnswer: "Yesterday" },
        { id: 63, word: "Tomorrow", chinese: "明天", image: "🗓️", unit: "Unit 9 時間", type: "choice", question: "今天的後一天叫什麼？", options: ["Yesterday", "Today", "Tomorrow", "Sunday"], correctAnswer: "Tomorrow" },
        { id: 64, word: "Morning", chinese: "早上", image: "🌅", unit: "Unit 9 時間", type: "choice", question: "太陽升起來的時候是什麼時段？", options: ["Afternoon", "Morning", "Evening", "Night"], correctAnswer: "Morning" },
        { id: 65, word: "Night", chinese: "晚上", image: "🌙", unit: "Unit 9 時間", type: "choice", question: "月亮和星星出來的時候是什麼時段？", options: ["Morning", "Afternoon", "Night", "Noon"], correctAnswer: "Night" },
        { id: 66, word: "Monday", chinese: "星期一", image: "📅", unit: "Unit 9 時間", type: "choice", question: "一週的第一個工作天叫什麼？", options: ["Sunday", "Monday", "Friday", "Saturday"], correctAnswer: "Monday" },
        { id: 67, word: "Sunday", chinese: "星期日", image: "📅", unit: "Unit 9 時間", type: "choice", question: "一週的最後一天叫什麼？", options: ["Monday", "Saturday", "Friday", "Sunday"], correctAnswer: "Sunday" },
        { id: 68, word: "Breakfast", chinese: "早餐", image: "🥞", unit: "Unit 9 時間", type: "choice", question: "早上吃的第一餐叫什麼？", options: ["Lunch", "Dinner", "Breakfast", "Snack"], correctAnswer: "Breakfast" },

        // ===== Unit 10 - 地點 & 交通 =====
        { id: 69, word: "School", chinese: "學校", image: "🏫", unit: "Unit 10 地點", type: "choice", question: "你每天去哪裡上課？", options: ["Hospital", "School", "Park", "Store"], correctAnswer: "School" },
        { id: 70, word: "Park", chinese: "公園", image: "🏞️", unit: "Unit 10 地點", type: "choice", question: "你去哪裡玩溜滑梯和盪鞦韆？", options: ["School", "Park", "Hospital", "Library"], correctAnswer: "Park" },
        { id: 71, word: "Hospital", chinese: "醫院", image: "🏥", unit: "Unit 10 地點", type: "choice", question: "生病了要去哪裡看醫生？", options: ["School", "Park", "Hospital", "Store"], correctAnswer: "Hospital" },
        { id: 72, word: "Bus", chinese: "公車", image: "🚌", unit: "Unit 10 地點", type: "choice", question: "很多人一起搭的大型交通工具叫什麼？", options: ["Car", "Bus", "Bike", "Taxi"], correctAnswer: "Bus" },
        { id: 73, word: "Car", chinese: "汽車", image: "🚗", unit: "Unit 10 地點", type: "choice", question: "'Car' 的中文意思是什麼？", options: ["公車", "汽車", "腳踏車", "火車"], correctAnswer: "汽車" },
        { id: 74, word: "Train", chinese: "火車", image: "🚆", unit: "Unit 10 地點", type: "choice", question: "在鐵軌上跑的交通工具叫什麼？", options: ["Bus", "Car", "Train", "Bike"], correctAnswer: "Train" },
        { id: 75, word: "Bicycle", chinese: "腳踏車", image: "🚲", unit: "Unit 10 地點", type: "choice", question: "用腳踩踏板的兩輪車叫什麼？", options: ["Car", "Bus", "Bicycle", "Taxi"], correctAnswer: "Bicycle" },

        // ===== Unit 11 - 形容詞 =====
        { id: 76, word: "Big", chinese: "大的", image: "🔺", unit: "Unit 11 形容詞", type: "choice", question: "'Big' 的中文意思是什麼？", options: ["小的", "大的", "高的", "矮的"], correctAnswer: "大的" },
        { id: 77, word: "Small", chinese: "小的", image: "🔻", unit: "Unit 11 形容詞", type: "choice", question: "'Small' 的中文意思是什麼？", options: ["大的", "小的", "長的", "短的"], correctAnswer: "小的" },
        { id: 78, word: "Happy", chinese: "快樂的", image: "😊", unit: "Unit 11 形容詞", type: "choice", question: "'Happy' 的中文意思是什麼？", options: ["傷心的", "快樂的", "生氣的", "害怕的"], correctAnswer: "快樂的" },
        { id: 79, word: "Sad", chinese: "傷心的", image: "😢", unit: "Unit 11 形容詞", type: "choice", question: "'Sad' 的中文意思是什麼？", options: ["快樂的", "傷心的", "生氣的", "興奮的"], correctAnswer: "傷心的" },
        { id: 80, word: "Beautiful", chinese: "美麗的", image: "🌸", unit: "Unit 11 形容詞", type: "choice", question: "'Beautiful' 的中文意思是什麼？", options: ["醜陋的", "美麗的", "快速的", "緩慢的"], correctAnswer: "美麗的" },
        { id: 81, word: "Fast", chinese: "快速的", image: "⚡", unit: "Unit 11 形容詞", type: "choice", question: "'Fast' 的中文意思是什麼？", options: ["慢的", "快速的", "高的", "重的"], correctAnswer: "快速的" },
        { id: 82, word: "Slow", chinese: "慢的", image: "🐢", unit: "Unit 11 形容詞", type: "choice", question: "烏龜走路很 _____。", options: ["Fast", "Slow", "Tall", "Short"], correctAnswer: "Slow" },
        { id: 83, word: "Tall", chinese: "高的", image: "🦒", unit: "Unit 11 形容詞", type: "choice", question: "長頸鹿非常 _____。", options: ["Short", "Tall", "Small", "Fat"], correctAnswer: "Tall" },
        { id: 84, word: "New", chinese: "新的", image: "✨", unit: "Unit 11 形容詞", type: "choice", question: "'New' 的相反是什麼？", options: ["Old", "Young", "Big", "Small"], correctAnswer: "Old" },
        { id: 85, word: "Old", chinese: "舊的/老的", image: "🏚️", unit: "Unit 11 形容詞", type: "choice", question: "'Old' 的中文意思是什麼？", options: ["新的", "舊的/老的", "年輕的", "大的"], correctAnswer: "舊的/老的" },

        // ===== Unit 12 - 動詞 =====
        { id: 86, word: "Run", chinese: "跑", image: "🏃", unit: "Unit 12 動詞", type: "choice", question: "'Run' 的中文意思是什麼？", options: ["走", "跑", "飛", "游泳"], correctAnswer: "跑" },
        { id: 87, word: "Walk", chinese: "走路", image: "🚶", unit: "Unit 12 動詞", type: "choice", question: "'Walk' 的中文意思是什麼？", options: ["跑", "走路", "跳", "坐"], correctAnswer: "走路" },
        { id: 88, word: "Jump", chinese: "跳", image: "🤸", unit: "Unit 12 動詞", type: "choice", question: "'Jump' 的中文意思是什麼？", options: ["走", "跑", "跳", "游泳"], correctAnswer: "跳" },
        { id: 89, word: "Swim", chinese: "游泳", image: "🏊", unit: "Unit 12 動詞", type: "choice", question: "在水裡移動叫什麼？", options: ["Run", "Walk", "Fly", "Swim"], correctAnswer: "Swim" },
        { id: 90, word: "Eat", chinese: "吃", image: "🍽️", unit: "Unit 12 動詞", type: "choice", question: "'Eat' 的中文意思是什麼？", options: ["喝", "吃", "睡", "玩"], correctAnswer: "吃" },
        { id: 91, word: "Drink", chinese: "喝", image: "🥤", unit: "Unit 12 動詞", type: "choice", question: "'Drink' 的中文意思是什麼？", options: ["吃", "喝", "睡", "看"], correctAnswer: "喝" },
        { id: 92, word: "Sleep", chinese: "睡覺", image: "😴", unit: "Unit 12 動詞", type: "choice", question: "'Sleep' 的中文意思是什麼？", options: ["起床", "睡覺", "吃飯", "洗澡"], correctAnswer: "睡覺" },
        { id: 93, word: "Read", chinese: "閱讀", image: "📖", unit: "Unit 12 動詞", type: "choice", question: "看書的動詞是什麼？", options: ["Write", "Read", "Draw", "Sing"], correctAnswer: "Read" },
        { id: 94, word: "Write", chinese: "寫", image: "✍️", unit: "Unit 12 動詞", type: "choice", question: "用筆記錄的動詞是什麼？", options: ["Read", "Write", "Draw", "Play"], correctAnswer: "Write" },
        { id: 95, word: "Play", chinese: "玩", image: "🎮", unit: "Unit 12 動詞", type: "choice", question: "'Play' 的中文意思是什麼？", options: ["工作", "學習", "玩", "休息"], correctAnswer: "玩" },
        { id: 96, word: "Sing", chinese: "唱歌", image: "🎤", unit: "Unit 12 動詞", type: "choice", question: "'Sing' 的中文意思是什麼？", options: ["跳舞", "唱歌", "畫畫", "寫字"], correctAnswer: "唱歌" },
        { id: 97, word: "Dance", chinese: "跳舞", image: "💃", unit: "Unit 12 動詞", type: "choice", question: "跟著音樂動身體叫什麼？", options: ["Sing", "Dance", "Run", "Walk"], correctAnswer: "Dance" },
        { id: 98, word: "Cook", chinese: "煮飯", image: "🧑‍🍳", unit: "Unit 12 動詞", type: "choice", question: "在廚房準備食物的動詞是什麼？", options: ["Eat", "Drink", "Cook", "Clean"], correctAnswer: "Cook" },
        { id: 99, word: "Open", chinese: "打開", image: "📂", unit: "Unit 12 動詞", type: "choice", question: "'Open' 的相反詞是什麼？", options: ["Close", "Start", "Stop", "Begin"], correctAnswer: "Close" },
        { id: 100, word: "Close", chinese: "關閉", image: "📁", unit: "Unit 12 動詞", type: "choice", question: "'Close' 的中文意思是什麼？", options: ["打開", "關閉", "開始", "結束"], correctAnswer: "關閉" },
    ],

    grammar: [
        // ===== Unit 1 - Be 動詞 =====
        { id: 1, unit: "Unit 1 Be動詞", question: "I _____ a student.", options: ["is", "am", "are", "be"], correctAnswer: "am", explanation: "主詞 'I' 永遠搭配 'am'。\n\n✅ Be 動詞規則：\nI → am\nHe / She / It → is\nWe / You / They → are" },
        { id: 2, unit: "Unit 1 Be動詞", question: "She _____ my teacher.", options: ["is", "am", "are", "be"], correctAnswer: "is", explanation: "主詞 'She' 是第三人稱單數，搭配 'is'。\n\n✅ 記住：He / She / It → is" },
        { id: 3, unit: "Unit 1 Be動詞", question: "They _____ happy.", options: ["is", "am", "are", "be"], correctAnswer: "are", explanation: "主詞 'They' 是複數，搭配 'are'。\n\n✅ We / You / They → are" },
        { id: 4, unit: "Unit 1 Be動詞", question: "We _____ friends.", options: ["is", "am", "are", "be"], correctAnswer: "are", explanation: "主詞 'We' 是複數，搭配 'are'。\n\n✅ We / You / They → are" },
        { id: 5, unit: "Unit 1 Be動詞", question: "It _____ a cat.", options: ["is", "am", "are", "be"], correctAnswer: "is", explanation: "主詞 'It' 是第三人稱單數，搭配 'is'。\n\n✅ He / She / It → is" },
        { id: 6, unit: "Unit 1 Be動詞", question: "He _____ not my brother.", options: ["is", "am", "are", "do"], correctAnswer: "is", explanation: "主詞 'He' 搭配 'is'，否定句：He is not = He isn't。\n\n✅ 否定句：主詞 + be動詞 + not" },

        // ===== Unit 2 - 冠詞 a / an =====
        { id: 7, unit: "Unit 2 冠詞", question: "I have _____ apple.", options: ["a", "an", "the", "some"], correctAnswer: "an", explanation: "'apple' 是母音 (a, e, i, o, u) 開頭的單字，前面要用 'an'。\n\n✅ 規則：\n子音開頭 → a (a book, a dog)\n母音開頭 → an (an apple, an egg, an umbrella)" },
        { id: 8, unit: "Unit 2 冠詞", question: "She is _____ teacher.", options: ["a", "an", "the", "some"], correctAnswer: "a", explanation: "'teacher' 是子音 't' 開頭，前面要用 'a'。\n\n✅ t 是子音，所以用 'a teacher'" },
        { id: 9, unit: "Unit 2 冠詞", question: "He has _____ orange.", options: ["a", "an", "the", "many"], correctAnswer: "an", explanation: "'orange' 是母音 'o' 開頭，用 'an'。\n\n✅ o 是母音 (a, e, i, o, u)，所以用 'an orange'" },
        { id: 10, unit: "Unit 2 冠詞", question: "This is _____ egg.", options: ["a", "an", "the", "some"], correctAnswer: "an", explanation: "'egg' 是母音 'e' 開頭，用 'an'。\n\n✅ e 是母音，所以用 'an egg'" },
        { id: 11, unit: "Unit 2 冠詞", question: "I want _____ book.", options: ["a", "an", "the", "some"], correctAnswer: "a", explanation: "'book' 是子音 'b' 開頭，用 'a'。\n\n✅ b 是子音，所以用 'a book'" },

        // ===== Unit 3 - 現在簡單式 =====
        { id: 12, unit: "Unit 3 現在簡單式", question: "She _____ to school every day.", options: ["go", "goes", "going", "went"], correctAnswer: "goes", explanation: "主詞 'She' 是第三人稱單數，現在簡單式動詞要加 's' 或 'es'。\n\n✅ 規則：He / She / It + 動詞加 s\n例如：He plays, She goes, It runs\n\n⚠️ go → goes（加 es）" },
        { id: 13, unit: "Unit 3 現在簡單式", question: "He _____ English very well.", options: ["speak", "speaks", "speaking", "spoke"], correctAnswer: "speaks", explanation: "主詞 'He' 是第三人稱單數，動詞加 's'。\n\n✅ speak → speaks" },
        { id: 14, unit: "Unit 3 現在簡單式", question: "They _____ soccer after school.", options: ["play", "plays", "playing", "played"], correctAnswer: "play", explanation: "主詞 'They' 是複數，動詞用原形，不需要加 's'。\n\n✅ 規則：\nI / You / We / They → 動詞原形\nHe / She / It → 動詞加 s" },
        { id: 15, unit: "Unit 3 現在簡單式", question: "My dog _____ fast.", options: ["run", "runs", "running", "ran"], correctAnswer: "runs", explanation: "'My dog' 等於 'It'，是第三人稱單數。\n\n✅ run → runs" },
        { id: 16, unit: "Unit 3 現在簡單式", question: "We _____ breakfast at 7:00.", options: ["eat", "eats", "eating", "ate"], correctAnswer: "eat", explanation: "主詞 'We' 是複數，動詞用原形 'eat'。\n\n✅ We eat, They eat (不加 s)" },

        // ===== Unit 4 - 疑問句 =====
        { id: 17, unit: "Unit 4 疑問句", question: "_____ you like ice cream?", options: ["Do", "Does", "Are", "Is"], correctAnswer: "Do", explanation: "主詞是 'you'，疑問句助動詞用 'Do'。\n\n✅ 規則：\nDo + I / you / we / they + 原形動詞？\nDoes + he / she / it + 原形動詞？" },
        { id: 18, unit: "Unit 4 疑問句", question: "_____ she like cats?", options: ["Do", "Does", "Is", "Are"], correctAnswer: "Does", explanation: "主詞 'she' 是第三人稱單數，疑問句用 'Does'。\n\n✅ Does she like...? / Does he play...? / Does it work...?" },
        { id: 19, unit: "Unit 4 疑問句", question: "_____ they students?", options: ["Do", "Does", "Are", "Is"], correctAnswer: "Are", explanation: "這題用的是 Be 動詞疑問句，'they' 搭配 'Are'。\n\n✅ Be 動詞疑問句：Be 動詞放句首\nAre they students?\nIs he a teacher?" },
        { id: 20, unit: "Unit 4 疑問句", question: "_____ is your name?", options: ["Who", "What", "Where", "When"], correctAnswer: "What", explanation: "問「你叫什麼名字」用 'What'。\n\n✅ 疑問詞：\nWhat = 什麼\nWho = 誰\nWhere = 哪裡\nWhen = 什麼時候\nHow = 如何" },
        { id: 21, unit: "Unit 4 疑問句", question: "_____ do you live?", options: ["What", "Who", "Where", "When"], correctAnswer: "Where", explanation: "問「你住哪裡」用 'Where'。\n\n✅ Where = 在哪裡\n例如：Where is the library? Where do you go?" },

        // ===== Unit 5 - 比較級 =====
        { id: 22, unit: "Unit 5 比較級", question: "He is _____ than his brother.", options: ["tall", "taller", "tallest", "more tall"], correctAnswer: "taller", explanation: "兩者比較用比較級：形容詞 + er + than。\n\n✅ 規則：\n短形容詞 → 加 er (tall→taller, fast→faster)\n長形容詞 → more + 原形 (beautiful→more beautiful)\n\n例如：taller than, bigger than" },
        { id: 23, unit: "Unit 5 比較級", question: "This book is _____ than that one.", options: ["interesting", "more interesting", "most interesting", "interestinger"], correctAnswer: "more interesting", explanation: "'interesting' 是長形容詞（超過兩個音節），比較級用 'more interesting'。\n\n✅ 長形容詞比較級：more + 形容詞\n例如：more beautiful, more exciting, more important" },
        { id: 24, unit: "Unit 5 比較級", question: "My cat is _____ than your cat.", options: ["big", "bigger", "biggest", "more big"], correctAnswer: "bigger", explanation: "'big' 是子音結尾的短形容詞，比較級要重複最後一個子音再加 er。\n\n✅ 特殊規則：\nbig → bigger (重複 g)\nhot → hotter (重複 t)\nthin → thinner (重複 n)" },
        { id: 25, unit: "Unit 5 比較級", question: "Today is _____ than yesterday.", options: ["cold", "colder", "coldest", "more cold"], correctAnswer: "colder", explanation: "'cold' 是短形容詞，直接加 er。\n\n✅ cold → colder → coldest" },

        // ===== Unit 6 - 現在進行式 =====
        { id: 26, unit: "Unit 6 現在進行式", question: "They _____ playing soccer now.", options: ["is", "am", "are", "be"], correctAnswer: "are", explanation: "現在進行式：主詞 + be 動詞 + V-ing\n\n主詞 'They' 搭配 'are'。\n\n✅ I am playing.\nHe/She/It is playing.\nWe/You/They are playing." },
        { id: 27, unit: "Unit 6 現在進行式", question: "She is _____ her homework.", options: ["do", "does", "doing", "did"], correctAnswer: "doing", explanation: "現在進行式的動詞要變成 V-ing 形式。\n\n✅ do → doing\nplay → playing\nread → reading\n\n結構：be動詞 + V-ing" },
        { id: 28, unit: "Unit 6 現在進行式", question: "I am _____ a book now.", options: ["read", "reads", "reading", "readed"], correctAnswer: "reading", explanation: "現在進行式：I am + V-ing\n\n✅ read → reading\n注意 'now' 是現在進行式的時間提示字！" },
        { id: 29, unit: "Unit 6 現在進行式", question: "Look! The cat is _____ on the bed.", options: ["sleep", "sleeps", "sleeping", "slept"], correctAnswer: "sleeping", explanation: "有 'Look!' 表示正在發生的事，用現在進行式。\n\n✅ sleep → sleeping\n注意：'Look!' 和 'Listen!' 常搭配現在進行式" },

        // ===== Unit 7 - There is / There are =====
        { id: 30, unit: "Unit 7 There is/are", question: "There _____ a book on the table.", options: ["is", "are", "am", "be"], correctAnswer: "is", explanation: "'a book' 是單數，用 'There is'。\n\n✅ There is + 單數名詞\nThere are + 複數名詞\n\n例如：There is a dog. / There are two dogs." },
        { id: 31, unit: "Unit 7 There is/are", question: "There _____ many students in the classroom.", options: ["is", "are", "am", "be"], correctAnswer: "are", explanation: "'many students' 是複數，用 'There are'。\n\n✅ many / some / two... → 複數 → There are" },
        { id: 32, unit: "Unit 7 There is/are", question: "There _____ three apples on the plate.", options: ["is", "are", "am", "have"], correctAnswer: "are", explanation: "'three apples' 是複數（三顆蘋果），用 'There are'。\n\n✅ 數字 + 名詞複數 → There are" },

        // ===== Unit 8 - 過去式 =====
        { id: 33, unit: "Unit 8 過去式", question: "She _____ her homework last night.", options: ["do", "does", "did", "doing"], correctAnswer: "did", explanation: "'last night' 表示過去，動詞用過去式。\n\n✅ do → did (不規則變化)\n\n過去式不分人稱：\nI did / She did / They did" },
        { id: 34, unit: "Unit 8 過去式", question: "We _____ to the park yesterday.", options: ["go", "goes", "went", "going"], correctAnswer: "went", explanation: "'yesterday' 表示過去，go 的過去式是 'went'。\n\n✅ go → went (不規則動詞)\n\n常見不規則：\ngo→went, eat→ate, see→saw, come→came" },
        { id: 35, unit: "Unit 8 過去式", question: "He _____ a good book last week.", options: ["read", "reads", "readed", "reading"], correctAnswer: "read", explanation: "'last week' 表示過去。read 的過去式也是 'read'（但發音不同）。\n\n✅ read → read（過去式拼法相同，發音 /red/）\n\n注意：這是不規則動詞，不是加 -ed！" },
        { id: 36, unit: "Unit 8 過去式", question: "They _____ basketball this morning.", options: ["play", "played", "plays", "playing"], correctAnswer: "played", explanation: "'this morning' 已經過去了，用過去式。\n\n✅ play → played（規則變化：加 -ed）\n\n規則動詞過去式：\n直接加 ed: play→played\n字尾 e 加 d: like→liked\n重複字尾加 ed: stop→stopped" },

        // ===== Unit 9 - 介系詞 =====
        { id: 37, unit: "Unit 9 介系詞", question: "The book is _____ the table.", options: ["in", "on", "at", "to"], correctAnswer: "on", explanation: "書在桌子「上面」，用 'on'。\n\n✅ 位置介系詞：\nin = 在裡面 (in the box)\non = 在上面 (on the table)\nunder = 在下面 (under the bed)\nnext to = 在旁邊" },
        { id: 38, unit: "Unit 9 介系詞", question: "The cat is _____ the box.", options: ["in", "on", "at", "to"], correctAnswer: "in", explanation: "貓在箱子「裡面」，用 'in'。\n\n✅ in = 在...裡面\n例如：in the room, in the bag, in the box" },
        { id: 39, unit: "Unit 9 介系詞", question: "She goes to school _____ bus.", options: ["in", "on", "by", "at"], correctAnswer: "by", explanation: "搭乘交通工具用 'by'。\n\n✅ 交通方式：\nby bus 搭公車\nby car 搭車\nby train 搭火車\non foot 走路（例外！）" },
        { id: 40, unit: "Unit 9 介系詞", question: "I wake up _____ 7 o'clock.", options: ["in", "on", "at", "to"], correctAnswer: "at", explanation: "時間點用 'at'。\n\n✅ 時間介系詞：\nat + 時間點 (at 7:00, at noon)\nin + 月份/季節/年 (in May, in summer)\non + 星期/日期 (on Monday, on May 5th)" },

        // ===== Unit 10 - 可數 / 不可數 =====
        { id: 41, unit: "Unit 10 可數/不可數", question: "I want some _____.", options: ["water", "waters", "a water", "the waters"], correctAnswer: "water", explanation: "'water'（水）是不可數名詞，不能加 s。\n\n✅ 不可數名詞：\nwater, milk, juice, rice, bread, money\n\n⚠️ 不可數名詞：\n不加 s / 不用 a/an / 用 some 或 much" },
        { id: 42, unit: "Unit 10 可數/不可數", question: "How _____ books do you have?", options: ["much", "many", "some", "any"], correctAnswer: "many", explanation: "'books' 是可數名詞複數，用 'How many'。\n\n✅ How many + 可數名詞複數？\nHow much + 不可數名詞？\n\n例如：\nHow many apples? / How much water?" },
        { id: 43, unit: "Unit 10 可數/不可數", question: "How _____ milk is there?", options: ["much", "many", "some", "few"], correctAnswer: "much", explanation: "'milk' 是不可數名詞，用 'How much'。\n\n✅ How much + 不可數名詞\n例如：How much money? How much time?" },

        // ===== Unit 11 - 代名詞 =====
        { id: 44, unit: "Unit 11 代名詞", question: "This is my book. It is _____.", options: ["my", "me", "mine", "I"], correctAnswer: "mine", explanation: "名詞性所有格 'mine' = 我的（東西）。\n\n✅ 所有格代名詞：\nmy → mine (我的)\nyour → yours (你的)\nhis → his (他的)\nher → hers (她的)\nour → ours (我們的)\ntheir → theirs (他們的)" },
        { id: 45, unit: "Unit 11 代名詞", question: "Give _____ the book, please.", options: ["I", "my", "me", "mine"], correctAnswer: "me", explanation: "'me' 是受格（放在動詞後面）。\n\n✅ 主格 / 受格：\nI → me\nyou → you\nhe → him\nshe → her\nwe → us\nthey → them\n\n例如：Give me... / Help her... / Tell them..." },

        // ===== Unit 12 - 複合句 =====
        { id: 46, unit: "Unit 12 連接詞", question: "I like cats _____ dogs.", options: ["but", "and", "or", "so"], correctAnswer: "and", explanation: "'and' 用來連接兩個同類的東西。\n\n✅ 連接詞：\nand = 和、以及（兩個都喜歡）\nbut = 但是（對比）\nor = 或者（選擇）\nso = 所以（結果）" },
        { id: 47, unit: "Unit 12 連接詞", question: "I want to play _____ I have homework.", options: ["and", "but", "or", "so"], correctAnswer: "but", explanation: "'but' 表示轉折：想玩「但是」有功課。\n\n✅ but = 但是\n前後是對比的意思。\n\n例如：I like it, but it is too expensive." },
        { id: 48, unit: "Unit 12 連接詞", question: "Do you want tea _____ coffee?", options: ["and", "but", "or", "so"], correctAnswer: "or", explanation: "'or' 用在選擇問句中：你要茶「還是」咖啡？\n\n✅ or = 或者、還是\n用在兩個選項中選一個。" },
        { id: 49, unit: "Unit 12 連接詞", question: "It was rainy, _____ I took my umbrella.", options: ["and", "but", "or", "so"], correctAnswer: "so", explanation: "'so' 表示因果：下雨了「所以」我帶了傘。\n\n✅ so = 所以\n前面是原因，後面是結果。\n\n例如：I was hungry, so I ate lunch." },
        { id: 50, unit: "Unit 12 連接詞", question: "She is smart _____ kind.", options: ["and", "but", "or", "so"], correctAnswer: "and", explanation: "'and' 連接兩個並列的形容詞。\n\n✅ 她很聰明「而且」很善良。\nand 用來列舉同方向的特質。" },
    ]
};
