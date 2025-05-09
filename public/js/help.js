async function loadFAQCategories() {
    try {
        const response = await api.get('/api/help/categories');
        const categories = response.data || [];

        const categoryList = document.getElementById('faqCategories');
        categoryList.innerHTML = '';

        categories.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.innerHTML = `
                <h3>${category.name}</h3>
                <div class="faq-list" id="faqList-${category.id}"></div>
            `;
            categoryList.appendChild(categoryItem);
            loadFAQs(category.id);
        });
    } catch (error) {
        console.error('Error loading FAQ categories:', error);
    }
}

async function loadFAQs(categoryId) {
    try {
        const response = await api.get(`/api/help/faqs?category=${categoryId}`);
        const faqs = response.data || [];

        const faqList = document.getElementById(`faqList-${categoryId}`);
        faqList.innerHTML = '';

        faqs.forEach(faq => {
            const faqItem = document.createElement('div');
            faqItem.className = 'faq-item';
            faqItem.innerHTML = `
                <div class="faq-question" onclick="toggleFAQ('${faq.id}')">
                    <h4>${faq.question}</h4>
                    <span class="toggle-icon">+</span>
                </div>
                <div class="faq-answer" id="faqAnswer-${faq.id}">
                    <p>${faq.answer}</p>
                </div>
            `;
            faqList.appendChild(faqItem);
        });
    } catch (error) {
        console.error('Error loading FAQs:', error);
    }
}

function toggleFAQ(faqId) {
    const answer = document.getElementById(`faqAnswer-${faqId}`);
    const toggleIcon = answer.previousElementSibling.querySelector('.toggle-icon');
    
    if (answer.style.display === 'block') {
        answer.style.display = 'none';
        toggleIcon.textContent = '+';
    } else {
        answer.style.display = 'block';
        toggleIcon.textContent = '-';
    }
}

document.getElementById('supportForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    const priority = document.getElementById('priority').value;

    try {
        const response = await api.post('/api/help/support', {
            subject,
            message,
            priority
        });

        if (response.success) {
            alert('Support ticket submitted successfully!');
            document.getElementById('supportForm').reset();
        } else {
            alert(response.message || 'Failed to submit support ticket');
        }
    } catch (error) {
        console.error('Error submitting support ticket:', error);
        alert('Failed to submit support ticket');
    }
});

document.getElementById('searchInput').addEventListener('input', async (e) => {
    const searchTerm = e.target.value.trim();
    
    if (searchTerm.length >= 3) {
        try {
            const response = await api.get(`/api/help/search?q=${encodeURIComponent(searchTerm)}`);
            const results = response.data || [];

            const searchResults = document.getElementById('searchResults');
            searchResults.innerHTML = '';

            if (results.length === 0) {
                searchResults.innerHTML = '<p>No results found</p>';
                return;
            }

            results.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `
                    <h4>${result.question}</h4>
                    <p>${result.answer}</p>
                    <small>Category: ${result.category}</small>
                `;
                searchResults.appendChild(resultItem);
            });
        } catch (error) {
            console.error('Error searching FAQs:', error);
        }
    }
});

document.addEventListener('DOMContentLoaded', loadFAQCategories); 