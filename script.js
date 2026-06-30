let upcomingData = []
let pastData = []
let activePlatform = 'ALL'

const platformList = ['ALL', 'codeforces.com', 'leetcode.com', 'codechef.com', 'atcoder.jp', 'hackerearth.com', 'hackerrank.com']

// ==================== INITIALIZATION ====================
window.onload = function() {
  makeFilterButtons()
  loadContests()
}

// ==================== LOAD CONTESTS ====================
function loadContests() {
  document.getElementById('upcomingGrid').innerHTML = '<p class="loader">Loading...</p>'
  document.getElementById('pastGrid').innerHTML = '<p class="loader">Loading...</p>'

  const today = new Date().toISOString().split('T')[0]

  const upcomingUrl = `https://clist.by/api/v1/json/contest/?username=dt_coder&api_key=8b89a22f5ea2c11ef10bb9b96c74137b8b105191&limit=100&format=json&order_by=start&start__gte=${today}`
  const pastUrl = `https://clist.by/api/v1/json/contest/?username=dt_coder&api_key=8b89a22f5ea2c11ef10bb9b96c74137b8b105191&limit=50&format=json&order_by=-start&start__lt=${today}`

  fetch(upcomingUrl)
    .then(res => res.json())
    .then(data => {
      upcomingData = data.objects || []
      showUpcoming(upcomingData)
    })
    .catch(err => {
      console.error(err)
      document.getElementById('upcomingGrid').innerHTML = '<p class="error">Error loading upcoming contests</p>'
    })

  fetch(pastUrl)
    .then(res => res.json())
    .then(data => {
      pastData = data.objects || []
      showPast(pastData)
    })
    .catch(err => {
      console.error(err)
      document.getElementById('pastGrid').innerHTML = '<p class="error">Error loading past contests</p>'
    })
}

// ==================== FILTER BUTTONS ====================
function makeFilterButtons() {
  const filterBar = document.getElementById('filterBar')
  filterBar.innerHTML = ''

  platformList.forEach(platform => {
    const btn = document.createElement('button')
    btn.textContent = platform === 'ALL' ? 'ALL' : platform.replace('.com','').replace('.jp','')
    btn.classList.add('filter-btn')
    if (platform === 'ALL') btn.classList.add('active')

    btn.onclick = () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      activePlatform = platform
      showUpcoming(upcomingData)
      showPast(pastData)
    }
    filterBar.appendChild(btn)
  })
}

// ==================== DISPLAY FUNCTIONS ====================
function showUpcoming(contests) {
  const box = document.getElementById('upcomingGrid')
  box.innerHTML = ''
  let list = activePlatform === 'ALL' ? contests : contests.filter(c => c.resource && c.resource.name === activePlatform)
  
  document.getElementById('upcomingCount').textContent = list.length || 0
  
  if (list.length === 0) {
    box.innerHTML = '<p class="no-contests">No upcoming contests found</p>'
    return
  }
  list.forEach(c => box.appendChild(buildCard(c, false)))
}

function showPast(contests) {
  const box = document.getElementById('pastGrid')
  box.innerHTML = ''
  let list = activePlatform === 'ALL' ? contests : contests.filter(c => c.resource && c.resource.name === activePlatform)
  
  document.getElementById('pastCount').textContent = list.length || 0
  
  if (list.length === 0) {
    box.innerHTML = '<p class="no-contests">No past contests found</p>'
    return
  }
  list.forEach(c => box.appendChild(buildCard(c, true)))
}


// ==================== BUILD CARD====================
function buildCard(contest, isOld) {
  const card = document.createElement('div')
  card.classList.add('card')

  // API returns time in UTC
  let startTime = new Date(contest.start);
  let endTime = new Date(contest.end);

  // Manual UTC to IST conversion (IST = UTC + 5:30)
  const utcOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in ms
  const startIST = new Date(startTime.getTime() + utcOffset);
  const endIST = new Date(endTime.getTime() + utcOffset);

  // Format date in IST
  const niceDate = startIST.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const hrs = Math.floor(contest.duration / 3600);
  const mins = Math.floor((contest.duration % 3600) / 60);
  const durationText = (hrs ? hrs + 'h ' : '') + (mins ? mins + 'm' : 'N/A');

  const siteName = contest.resource ? contest.resource.name : 'Unknown';

  // Live check using original UTC time
  const now = Date.now();
  const isLive = now >= startTime.getTime() && now <= endTime.getTime();

  let statusBadge = isLive ? 
    '<span class="badge-live">🔴 Live</span>' : 
    (!isOld ? '<span class="badge-upcoming">Upcoming</span>' : '<span class="badge-past">Past</span>');

  const timerId = 'timer-' + contest.id;
  const ytLink = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(contest.event + ' editorial');
  const calLink = buildCalendarLink(contest);

  let btnHtml = isOld ? `
    <a href="${contest.href}" target="_blank" class="btn-join">View Contest</a>
    <a href="${ytLink}" target="_blank" class="btn-youtube">▶ Editorial</a>
  ` : `
    <a href="${contest.href}" target="_blank" class="btn-join">Join Contest</a>
    <a href="${calLink}" target="_blank" class="btn-calendar">+ Calendar</a>
    <button class="ai-tip-btn" onclick="getAITips('${contest.event.replace(/'/g,"\\'")}', '${siteName}')">Get AI Tips</button>
  `;

  card.innerHTML = `
    <div class="badge-row"><span class="badge-platform">${siteName}</span>${statusBadge}</div>
    <p class="card-name">${contest.event}</p>
    <div class="card-info">📅 ${niceDate}</div>
    <div class="card-info">⏱ Duration: ${durationText}</div>
    <div class="countdown-row" id="${timerId}"></div>
    <div class="card-buttons">${btnHtml}</div>
  `;

  if (!isOld && !isLive) startTimer(contest.start, timerId);
  if (isLive) {
    const el = document.getElementById(timerId);
    if (el) el.innerHTML = '<span class="countdown-box">🔴 Live Now</span>';
  }

  return card;
}

// ==================== TIMER ====================
function startTimer(startTimeUTC, timerId) {
  const startUTC = new Date(startTimeUTC);
  const utcOffset = 5.5 * 60 * 60 * 1000; // IST offset
  const startIST = new Date(startUTC.getTime() + utcOffset);

  const ticker = setInterval(() => {
    const el = document.getElementById(timerId);
    if (!el) {
      clearInterval(ticker);
      return;
    }

    const now = Date.now();
    const diff = startIST.getTime() - now;

    if (diff <= 0) {
      el.innerHTML = '<span class="countdown-box">🔴 Live Now</span>';
      clearInterval(ticker);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    let html = '<span class="countdown-label">Starts in</span>';
    if (days > 0) html += `<span class="countdown-box">${days}d</span>`;
    html += `<span class="countdown-box">${String(hours).padStart(2, '0')}h</span>`;
    html += `<span class="countdown-box">${String(mins).padStart(2, '0')}m</span>`;
    html += `<span class="countdown-box">${String(secs).padStart(2, '0')}s</span>`;

    el.innerHTML = html;
  }, 1000);
}

// ==================== CALENDAR LINK ====================
function buildCalendarLink(contest) {
  const startUTC = new Date(contest.start);
  const endUTC = new Date(contest.end);

  // Add +5:30 hours for IST
  const istOffset = 5.5 * 60 * 60 * 1000;
  
  const startIST = new Date(startUTC.getTime() + istOffset);
  const endIST = new Date(endUTC.getTime() + istOffset);

  // Format as Google Calendar expects: YYYYMMDDT HHMMSS
  const formatForCalendar = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = "00";
    
    return `${year}${month}${day}T${hour}${minute}${second}`;
  };

  const startFormatted = formatForCalendar(startIST);
  const endFormatted = formatForCalendar(endIST);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(contest.event)}&dates=${startFormatted}/${endFormatted}&details=Contest on ${contest.resource ? contest.resource.name : 'Platform'}`;
}
// ==================== GEMINI API ====================

const GEMINI_API_KEY = "AQ.Ab8RN6JwFF2jlvGpHeQw9caOVJ1xnrWIdALzZHvnA-Zck1VgLQ"; // Paste your new key here

async function callGemini(prompt) {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 20000
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error("Gemini API Error:", response.status);
            console.error(error);

            if (response.status === 401) {
                return "❌ Invalid API key.";
            }

            if (response.status === 403) {
                return "❌ API access denied. Check your Gemini API project.";
            }

            if (response.status === 404) {
                return "❌ Model not found.";
            }

            return `❌ API Error (${response.status})`;
        }

        const data = await response.json();
        console.log(data);

        return (
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No response generated."
        );

    } catch (err) {
        console.error(err);
        return "❌ Failed to connect to Gemini API.";
    }
}
// ==================== AI TIPS (Only for Upcoming) ====================
async function getAITips(contestName, platform) {
  document.getElementById('modalTitle').textContent = `AI Tips - ${contestName}`
  document.getElementById('aiModal').style.display = 'flex'
  document.getElementById('modalBody').innerHTML = '<p class="loader">Generating detailed tips...</p>'

  const prompt = `You are an experienced competitive programmer.

Contest: "${contestName}" on ${platform}

Give detailed practical advice including expected topics, strategy, time management, and common mistakes.
Write in clean paragraphs with minimal formatting.`

  const reply = await callGemini(prompt)
  document.getElementById('modalBody').innerHTML = reply.replace(/\n/g, '<br>')
}

// ==================== CODEFORCES ANALYSIS ====================
async function analyzeCodeforces() {
  const handle = document.getElementById('cfHandle').value.trim()
  if (!handle) return alert("Please enter your Codeforces handle!")

  const resultDiv = document.getElementById('cfResult')
  resultDiv.innerHTML = '<p class="loader">Analyzing your Codeforces performance...</p>'

  try {
    const res = await fetch(`https://codeforces.com/api/user.rating?handle=${handle}`)
    const data = await res.json()

    if (data.status !== "OK") throw new Error()

    const contests = data.result.slice(-15)
    let history = contests.map(c => 
      `${c.contestName} → Rating ${c.newRating} (${c.newRating - c.oldRating >= 0 ? '+' : ''}${c.newRating - c.oldRating})`
    ).join("\n")

    const prompt = `You are a top Codeforces coach. Student: ${handle}\n\nRecent contests:\n${history}\n\nGive detailed analysis: trend, strengths, weak areas, and suggestions. Write cleanly.`

    const reply = await callGemini(prompt)
    resultDiv.innerHTML = reply.replace(/\n/g, '<br>')
  } catch (e) {
    resultDiv.innerHTML = "❌ Invalid handle or failed to fetch data."
  }
}

// ==================== MODAL ====================
function closeModal() {
  document.getElementById('aiModal').style.display = 'none'
}
// Clear Codeforces Analysis
function clearCFAnalysis() {
  document.getElementById('cfResult').innerHTML = '';
  document.getElementById('cfHandle').value = '';
}
