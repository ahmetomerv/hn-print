const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0'

const fetchBtn = document.getElementById('fetchBtn')
const printBtn = document.getElementById('printBtn')
const loading = document.getElementById('loading')
const error = document.getElementById('error')
const newspaper = document.getElementById('newspaper')
const articlesContainer = document.getElementById('articlesContainer')
const topStoryContainer = document.getElementById('topStoryContainer')
const dateElement = document.getElementById('date')
const headerDateElement = document.getElementById('headerDate')
const volumeElement = document.getElementById('volume')

function numberToRoman(num) {
    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
    const numerals = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']
    let result = ''

    for (let i = 0; i < values.length; i++) {
        while (num >= values[i]) {
            result += numerals[i]
            num -= values[i]
        }
    }
    return result
}

function setVolumeNumber() {
    const romanNum = Math.floor(Math.random() * 999) + 1
    const romanValue = numberToRoman(romanNum)

    const threeDigitNum = Math.floor(Math.random() * 900) + 100
    volumeElement.textContent = `VOL. ${romanValue} ${threeDigitNum}`
}

function setCurrentDate() {
    const today = new Date()
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    dateElement.textContent = today.toLocaleDateString('en-US', options).toUpperCase()

    const weekday = today.toLocaleDateString('en-US', { weekday: 'long' })
    const month = today.toLocaleDateString('en-US', { month: 'long' })
    const day = today.getDate()
    const year = today.getFullYear()
    headerDateElement.textContent = `${weekday}, ${month} ${day}, ${year}`
}

async function fetchStory(id) {
    try {
        const response = await fetch(`${HN_API_BASE}/item/${id}.json`)
        if (!response.ok) throw new Error('Failed to fetch story')
        return await response.json()
    } catch (err) {
        console.error('Error fetching story:', err)
        return null
    }
}

async function fetchTopStories() {
    try {
        const response = await fetch(`${HN_API_BASE}/topstories.json`)
        if (!response.ok) throw new Error('Failed to fetch top stories')
        const storyIds = await response.json()
        return storyIds.slice(0, 28)
    } catch (err) {
        console.error('Error fetching top stories:', err)
        throw err
    }
}

function getDomain(url) {
    try {
        const urlObj = new URL(url)
        return urlObj.hostname.replace('www.', '')
    } catch {
        return ''
    }
}

function formatStoryText(text, maxLength = 500) {
    if (!text) return ''

    const div = document.createElement('div')
    div.innerHTML = text
    let plainText = div.textContent || div.innerText || ''

    plainText = plainText.replace(/\s+/g, ' ').trim()

    if (plainText.length > maxLength) {
        plainText = plainText.substring(0, maxLength)
        const lastPeriod = plainText.lastIndexOf('.')
        const lastExclamation = plainText.lastIndexOf('!')
        const lastQuestion = plainText.lastIndexOf('?')
        const lastSentence = Math.max(lastPeriod, lastExclamation, lastQuestion)
        if (lastSentence > maxLength * 0.7) {
            plainText = plainText.substring(0, lastSentence + 1)
        } else {
            plainText += '...'
        }
    }

    return plainText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

function createArticleHTML(story, index) {
    const domain = story.url ? getDomain(story.url) : ''
    const date = new Date(story.time * 1000).toLocaleDateString()
    const isLarge = index === 0

    const storyText = formatStoryText(story.text || '', isLarge ? 400 : 250)

    const escapedTitle = story.title
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
    
    let articleHTML = ''

    const authorName = story.by ? story.by : 'Unknown'

    if (isLarge) {
        // Top story - centered and prominent
        articleHTML = `
            <div class="newspaper-container col-span-2 mb-10 pb-8 border-b-2 border-gray-400 text-center">
                <h3 class="text-5xl font-bold mb-4 uppercase tracking-tight leading-tight">${escapedTitle}</h3>
                <div class="border-t border-gray-400 mb-4 pt-3 max-w-2xl mx-auto">
                    <p class="text-sm italic text-gray-700 mb-2">
                        ${story.url ? `Originally written and published on: ${story.url}` : 'Discussion on Hacker News'}
                    </p>
                    <p class="text-sm text-gray-600">
                        by <strong>${authorName}</strong> | ${story.score || 0} points | ${story.descendants || 0} comments | ${date}
                    </p>
                </div>
            </div>
        `;
    } else {
        // Regular stories (smaller font for columns, in equal-height rows)
        articleHTML = `
            <div class="story-cell pb-6">
                <h3 class="text-base font-bold mb-1 uppercase tracking-tight leading-tight line-clamp-2">${escapedTitle}</h3>
                <div class="border-t border-gray-400 mb-1 pt-1 flex-1 flex flex-col justify-between">
                    <p class="text-xs italic text-gray-700 mb-1 line-clamp-2">
                        ${story.url ? `Originally written and published on: ${story.url}` : 'Discussion on Hacker News'}
                    </p>
                    <p class="text-xs text-gray-600">
                        by <strong>${authorName}</strong> | ${story.score || 0} points | ${story.descendants || 0} comments | ${date}
                    </p>
                </div>
            </div>
        `
    }
    
    return articleHTML
}

function displayStories(stories) {
    topStoryContainer.innerHTML = ''
    articlesContainer.innerHTML = ''

    if (stories.length > 0 && stories[0] && stories[0].title) {
        const topStoryHTML = createArticleHTML(stories[0], 0)
        topStoryContainer.innerHTML = topStoryHTML
    }
    
    // Display remaining stories in 3 columns (9 per column = 27 stories)
    const remainingStories = stories.slice(1, 28).filter(s => s && s.title)
    
    // Organize stories into 3 columns: 9 stories per column, each spanning 1 row (9 rows total)
    const storiesPerColumn = 9
    for (let col = 0; col < 3; col++) {
        const columnDiv = document.createElement('div')
        columnDiv.className = 'column-grid'
        const startIdx = col * storiesPerColumn
        const endIdx = startIdx + storiesPerColumn
        const columnStories = remainingStories.slice(startIdx, endIdx)

        columnStories.forEach((story) => {
            const articleHTML = createArticleHTML(story, 1)
            columnDiv.insertAdjacentHTML('beforeend', articleHTML)
        })
        articlesContainer.appendChild(columnDiv)
    }

    newspaper.classList.remove('hidden')
    loading.classList.add('hidden')
    printBtn.classList.remove('hidden')
    newspaper.classList.remove('newspaper-printing')
    void newspaper.offsetWidth
    newspaper.classList.add('newspaper-printing')

    setTimeout(() => {
        newspaper.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
}

async function fetchAndDisplayStories() {
    error.classList.add('hidden')
    loading.classList.remove('hidden')
    newspaper.classList.add('hidden')
    printBtn.classList.add('hidden')
    
    try {
        const storyIds = await fetchTopStories()

        const stories = []
        const batchSize = 10

        for (let i = 0; i < storyIds.length; i += batchSize) {
            const batch = storyIds.slice(i, i + batchSize)
            const batchPromises = batch.map(id => fetchStory(id))
            const batchResults = await Promise.all(batchPromises)
            stories.push(...batchResults.filter(s => s && s.type === 'story'))
        }

        stories.sort((a, b) => (b.score || 0) - (a.score || 0))

        displayStories(stories)
    } catch (err) {
        console.error('Error:', err)
        loading.classList.add('hidden')
        error.classList.remove('hidden')
    }
}

function printNewspaper() {
    if (newspaper.classList.contains('hidden')) {
        alert('Please fetch stories first!')
        return
    }
    window.print()
}

const helpBtn = document.getElementById('helpBtn')
const modal = document.getElementById('modal')
const closeModal = document.getElementById('closeModal')

function openModal() {
    modal.classList.remove('hidden')
}

function closeModalFunc() {
    modal.classList.add('hidden')
}

fetchBtn.addEventListener('click', fetchAndDisplayStories)
printBtn.addEventListener('click', printNewspaper)
helpBtn.addEventListener('click', openModal)
closeModal.addEventListener('click', closeModalFunc)

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModalFunc()
    }
})

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModalFunc()
    }
})

setCurrentDate()
setVolumeNumber()
