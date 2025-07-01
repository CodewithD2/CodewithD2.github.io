const ytContainer = document.getElementById('youtube-latest');
const ytRssUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=UCo0qWmxZdc1FhAL5emRNzcA";
const apiUrl = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(ytRssUrl);

fetch(apiUrl)
  .then(res => res.json())
  .then(data => {
    if (!data.items || data.items.length === 0) {
      ytContainer.innerHTML = `<p class="text-gray-400">Could not load latest video.</p>`;
      return;
    }
    const video = data.items[0];
    const videoIdMatch = video.link.match(/v=([a-zA-Z0-9_-]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : "";
    ytContainer.innerHTML = `
      <div class="w-full flex flex-col items-center">
        <div class="w-full aspect-video max-w-xl rounded-2xl overflow-hidden shadow-lg mb-4">
          <iframe 
            width="100%" height="315"
            src="https://www.youtube.com/embed/${videoId}" 
            title="${video.title}" 
            frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
            class="w-full h-full"></iframe>
        </div>
        <a href="${video.link}" target="_blank" class="text-lg font-semibold text-pink-300 hover:underline">${video.title}</a>
        <div class="text-xs text-gray-400 mt-1">${new Date(video.pubDate).toLocaleDateString()}</div>
      </div>
    `;
  })
  .catch(() => {
    ytContainer.innerHTML = `<p class="text-gray-400">Could not load latest video.</p>`;
  });
