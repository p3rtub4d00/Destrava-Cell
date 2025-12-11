document.addEventListener('DOMContentLoaded', () => {
    
    // 1. MENU MOBILE
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links li');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if(navLinks.classList.contains('active')){
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Fecha menu ao clicar em link
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if(navLinks.classList.contains('active')){
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });

    // 2. FAQ ACORDEÃO
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            item.classList.toggle('active');
        });
    });

    // 3. ANIMAÇÃO DE SCROLL
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });
    document.querySelectorAll('.card, .review-card').forEach(el => {
        el.style.opacity = 0; el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });

    // 4. BOTS DE NOTIFICAÇÃO
    const names = ["Carlos S.", "Eduardo M.", "Ana P.", "Rogério T.", "Fernanda", "João P.", "Lucas B.", "Marcos V."];
    const actions = [
        { text: "Desbloqueou Conta Google", icon: "fa-unlock" },
        { text: "Removeu MDM/PayJoy", icon: "fa-file-invoice-dollar" },
        { text: "Vendeu um S22 Ultra", icon: "fa-hand-holding-usd" },
        { text: "Solicitou orçamento", icon: "fa-comments" }
    ];
    const cities = ["Porto Velho", "Ji-Paraná", "Ariquemes", "Cacoal", "Online"];

    function showNotification() {
        const container = document.getElementById('notification-container');
        if(!container) return;

        const rName = names[Math.floor(Math.random() * names.length)];
        const rAction = actions[Math.floor(Math.random() * actions.length)];
        const rCity = cities[Math.floor(Math.random() * cities.length)];

        const notif = document.createElement('div');
        notif.classList.add('notification-toast');
        notif.innerHTML = `
            <div class="toast-icon"><i class="fas ${rAction.icon}"></i></div>
            <div class="toast-content">
                <h4>${rName} - ${rCity}</h4>
                <p>${rAction.text}</p>
            </div>
        `;
        container.appendChild(notif);
        setTimeout(() => notif.remove(), 5000);
    }

    setTimeout(() => {
        showNotification();
        setInterval(() => {
            showNotification();
        }, Math.floor(Math.random() * (15000 - 8000 + 1) + 8000));
    }, 3000);
});
