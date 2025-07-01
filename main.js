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
  });

// Fetch repositories and calculate total stars
fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`)
  .then(res => res.json())
  .then(repos => {
    let totalStars = 0;
    const projectList = document.getElementById('project-list');
    repos
      .filter(r => !r.fork)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .forEach(repo => {
        totalStars += repo.stargazers_count;
        const langBadge = repo.language
          ? `<span class="bg-gray-200 dark:bg-gray-700 text-xs rounded px-2 py-1">${repo.language}</span>`
          : '';
        projectList.innerHTML += `
          <div class="bg-white dark:bg-gray-800 shadow rounded p-5 flex flex-col justify-between min-h-[180px]">
            <div>
              <a href="${repo.html_url}" target="_blank" class="text-xl font-semibold text-blue-700 dark:text-blue-300 hover:underline">${repo.name}</a>
              <p class="mt-2 text-gray-700 dark:text-gray-300 text-sm">${repo.description || ''}</p>
            </div>
            <div class="flex items-center justify-between mt-4">
              <div class="flex gap-2">
                ${langBadge}
                <span class="flex items-center gap-1 text-sm"><i data-feather="star" class="w-4 h-4"></i> ${repo.stargazers_count}</span>
              </div>
              ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" class="text-xs text-blue-600 dark:text-blue-400 underline">Live Demo</a>` : ''}
            </div>
          </div>
        `;
      });
    document.getElementById('stars').textContent = totalStars;
    feather.replace();
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
