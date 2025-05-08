class TravelChatbot {
    constructor() {
        this.routes = [];
        this.conversationHistory = [];
        this.loadRoutes();
    }

    async loadRoutes() {
        try {
            const response = await fetch('http://localhost:3000/api/routes');
            this.routes = await response.json();
        } catch (error) {
            console.error('Error loading routes:', error);
        }
    }

    async processMessage(message) {
        // Добавляем сообщение пользователя в историю
        this.conversationHistory.push({ role: 'user', content: message });

        try {
            // Формируем контекст с информацией о маршрутах
            const routesContext = this.routes.map(route => 
                `Маршрут: ${route.title}\n` +
                `Описание: ${route.description}\n` +
                `От: ${route.start_location}\n` +
                `До: ${route.end_location}\n` +
                `Длительность: ${route.duration_days} дней\n` +
                `Сложность: ${route.difficulty_level}\n`
            ).join('\n');

            // Формируем системный промпт
            const systemPrompt = `Ты - помощник по планированию путешествий. У тебя есть информация о следующих маршрутах:\n\n${routesContext}\n\n` +
                'Твоя задача - помогать пользователям находить подходящие маршруты и отвечать на их вопросы о путешествиях. ' +
                'Используй предоставленную информацию о маршрутах для ответов. ' +
                'Если пользователь спрашивает о маршрутах, которых нет в базе, честно скажи об этом. ' +
                'Отвечай на русском языке, если пользователь пишет на русском, и на английском, если на английском.';

            // Формируем запрос к DeepSeek API
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer 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'
                },
                body: JSON.stringify({
                    model: 'deepseek/deepseek-chat-v3-0324:free',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...this.conversationHistory
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.choices?.[0]?.message?.content) {
                throw new Error('Invalid response format from DeepSeek API');
            }

            const botResponse = data.choices[0].message.content;
            // Добавляем ответ бота в историю
            this.conversationHistory.push({ role: 'assistant', content: botResponse });
            return botResponse;

        } catch (error) {
            console.error('Error processing message with DeepSeek:', error);
            // Возвращаем более информативное сообщение об ошибке
            if (error.message.includes('401')) {
                return 'Ошибка аутентификации: неверный API ключ. Пожалуйста, проверьте ключ и попробуйте снова.';
            } else if (error.message.includes('429')) {
                return 'Превышен лимит запросов к API. Пожалуйста, подождите немного и попробуйте снова.';
            } else {
                return 'Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.';
            }
        }
    }

    // Очистка истории диалога
    clearHistory() {
        this.conversationHistory = [];
    }

    processMessageOld(message) {
        message = message.toLowerCase();
        
        // Поиск маршрутов по ключевым словам
        if (message.includes('маршрут') || message.includes('route')) {
            return this.findRoutes(message);
        }
        
        // Поиск по сложности
        if (message.includes('легкий') || message.includes('easy')) {
            return this.findRoutesByDifficulty('Easy');
        }
        if (message.includes('средний') || message.includes('medium')) {
            return this.findRoutesByDifficulty('Medium');
        }
        if (message.includes('сложный') || message.includes('hard')) {
            return this.findRoutesByDifficulty('Hard');
        }

        // Поиск по длительности
        if (message.includes('дней') || message.includes('days')) {
            const days = this.extractNumber(message);
            if (days) {
                return this.findRoutesByDuration(days);
            }
        }

        // Общая информация
        if (message.includes('привет') || message.includes('hello')) {
            return 'Привет! Я чат-бот для помощи в планировании путешествий. Я могу помочь найти маршруты по сложности, длительности или ключевым словам. Что вас интересует?';
        }

        if (message.includes('помощь') || message.includes('help')) {
            return 'Я могу помочь вам найти маршруты. Вы можете спросить меня о:\n' +
                   '- Маршрутах определенной сложности (легкий, средний, сложный)\n' +
                   '- Маршрутах определенной длительности (например, "маршруты на 5 дней")\n' +
                   '- Конкретных маршрутах по ключевым словам\n' +
                   'Просто задайте вопрос!';
        }

        return 'Извините, я не совсем понял ваш вопрос. Попробуйте переформулировать или спросите "помощь" для получения списка возможностей.';
    }

    findRoutes(message) {
        const keywords = message.split(' ').filter(word => 
            word.length > 3 && !['маршрут', 'route', 'найти', 'find'].includes(word)
        );

        const matchingRoutes = this.routes.filter(route => {
            const routeText = `${route.title} ${route.description} ${route.start_location} ${route.end_location}`.toLowerCase();
            return keywords.some(keyword => routeText.includes(keyword));
        });

        if (matchingRoutes.length === 0) {
            return 'К сожалению, я не нашел маршрутов по вашему запросу. Попробуйте другие ключевые слова.';
        }

        return 'Вот что я нашел:\n' + matchingRoutes.map(route => 
            `- ${route.title}: ${route.description}\n` +
            `  От ${route.start_location} до ${route.end_location}\n` +
            `  Длительность: ${route.duration_days} дней, Сложность: ${route.difficulty_level}`
        ).join('\n\n');
    }

    findRoutesByDifficulty(difficulty) {
        const matchingRoutes = this.routes.filter(route => 
            route.difficulty_level.toLowerCase() === difficulty.toLowerCase()
        );

        if (matchingRoutes.length === 0) {
            return `К сожалению, я не нашел маршрутов со сложностью "${difficulty}".`;
        }

        return `Вот ${difficulty.toLowerCase()} маршруты:\n` + matchingRoutes.map(route => 
            `- ${route.title}: ${route.description}\n` +
            `  От ${route.start_location} до ${route.end_location}\n` +
            `  Длительность: ${route.duration_days} дней, Сложность: ${route.difficulty_level}`
        ).join('\n\n');
    }

    findRoutesByDuration(days) {
        const matchingRoutes = this.routes.filter(route => 
            route.duration_days <= days
        );

        if (matchingRoutes.length === 0) {
            return `К сожалению, я не нашел маршрутов длительностью ${days} дней.`;
        }

        return `Вот маршруты длительностью ${days} дней:\n` + matchingRoutes.map(route => 
            `- ${route.title}: ${route.description}\n` +
            `  От ${route.start_location} до ${route.end_location}\n` +
            `  Длительность: ${route.duration_days} дней, Сложность: ${route.difficulty_level}`
        ).join('\n\n');
    }
}

// Export for browser environment
window.TravelChatbot = TravelChatbot;
