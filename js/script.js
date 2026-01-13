// JavaScript для интерактивности сайта

document.addEventListener("DOMContentLoaded", function () {
  console.log("AI Tools сайт загружен");

  // Анимация кнопки
  const button = document.querySelector(".btn-primary");

  if (button) {
    button.addEventListener("click", function () {
      alert("Спасибо за интерес к нашему продукту!");
    });
  }

  // Плавная прокрутка для навигации
  const navLinks = document.querySelectorAll("nav a");

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetSection = document.querySelector(this.getAttribute("href"));

      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: "smooth",
        });
      }
    });
  });
});
