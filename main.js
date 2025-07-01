const username = "CodewithD2";

// Fetch GitHub profile
fetch(`https://api.github.com/users/${username}`)
  .then(res => res.json())
  .then(profile => {
    document.getElementById('avatar').src = profile.avatar_url;
    document.getElementById('name').textContent = profile.name || profile.login;
    document.getElementById('bio').textContent = profile.bio || '';
    document.getElementById('followers').textContent = profile.followers;
    document.getElementById('repos').textContent = profile.public_repos;
    document.getElementById('profile-link').href = profile.html_url;
  })
  .catch(() => {
    document.getElementById('name').textContent = "Profile could not be loaded";
    document.getElementById('bio').textContent = "";
  });

// Fetch repositories and calculate total stars
fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`)
  .then(res => res.json())
  .then(repos => {
    let totalStars = 0;
    const projectList = document.getElementById('project-list');
    projectList.innerHTML = "";
    repos
      .filter(r => !r.fork)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 9)
      .forEach(repo => {
        totalStars += repo.stargazers_count;
        const langBadge = repo.language
          ? `<span class="inline-block bg-gradient-to-r from-purple-400 to-pink-400 text-white text-xs font-semibold rounded-full px-3 py-1 mr-2">${repo.language}</span>`
          : '';
        const starBadge = repo.stargazers_count > 0
          ? `<span class="flex items-center text-yellow-400 text-sm font-semibold ml-2"><i data-feather="star" class="w-4 h-4"></i>${repo.stargazers_count}</span>`
          : '';
        projectList.innerHTML += `
          <div class="bg-white/10 dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-xl p-7 flex flex-col justify-between min-h-[220px] border-2 border-transparent hover:border-pink-400 hover:scale-105 transition duration-300">
            <a href="${repo.html_url}" target="_blank" class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-red-400 hover:underline">${repo.name}</a>
            <p class="mt-2 text-gray-200 text-base">${repo.description || ''}</p>
            <div class="flex items-center justify-between mt-4">
              <div class="flex gap-2 items-center">
                ${langBadge}
                ${starBadge}
              </div>
              ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" class="text-xs bg-pink-500 text-white px-3 py-1 rounded-full font-bold shadow hover:bg-pink-600 transition">Live Demo</a>` : ''}
            </div>
          </div>
        `;
      });
    document.getElementById('stars').textContent = totalStars;
    feather.replace();
  })
  .catch(() => {
    document.getElementById('project-list').innerHTML = "<p class='text-gray-400'>Could not load projects.</p>";
    document.getElementById('stars').textContent = "0";
  });


// Dark mode toggle
const darkToggle = document.getElementById('dark-toggle');
darkToggle.onclick = () => {
  document.documentElement.classList.toggle('dark');
  localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

// Load dark mode preference
if(localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)){
  document.documentElement.classList.add('dark');
}
