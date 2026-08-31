import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const { url, rawText } = body;

    // 1. Handle Raw Text Input
    if (rawText !== undefined) {
      const trimmedText = typeof rawText === 'string' ? rawText.trim() : '';
      if (!trimmedText) {
        return NextResponse.json(
          { error: 'Input text content cannot be empty.' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        title: 'Direct Text Input',
        text: trimmedText,
        bodyText: trimmedText,
        ogDescription: '',
      });
    }

    // 2. Handle URL Input
    const trimmedUrl = typeof url === 'string' ? url.trim() : '';
    if (!trimmedUrl) {
      return NextResponse.json(
        { error: 'Either url or rawText must be provided and cannot be empty.' },
        { status: 400 }
      );
    }

    let targetUrl = trimmedUrl;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    // Fetch the URL
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
        { status: 500 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract Title
    const title =
      $('title').text().trim() ||
      $('h1').first().text().trim() ||
      'Untitled Article';

    // Extract OpenGraph description (with fallback to normal description)
    const ogDescription =
      $('meta[property="og:description"]').attr('content')?.trim() ||
      $('meta[name="description"]').attr('content')?.trim() ||
      '';

    // Remove unwanted elements to get clean text
    $(
      'script, style, nav, footer, iframe, noscript, header, ads, .ads, #ads, .sidebar, #sidebar, .comments, #comments, svg, path, button, link'
    ).remove();

    // Extract text paragraphs
    const bodyParagraphs: string[] = [];

    // Try finding paragraphs in common content containers first, then fallback
    const containers = [
      'article',
      'main',
      '.article-body',
      '.post-content',
      '.entry-content',
      '.story-content',
    ];

    let foundContent = false;
    for (const container of containers) {
      const el = $(container);
      if (el.length > 0) {
        el.find('p').each((_, pEl) => {
          const txt = $(pEl).text().replace(/\s+/g, ' ').trim();
          if (txt.length > 40 && !bodyParagraphs.includes(txt)) {
            bodyParagraphs.push(txt);
          }
        });
        if (bodyParagraphs.length > 0) {
          foundContent = true;
          break;
        }
      }
    }

    // Fallback: search all paragraphs on the page
    if (!foundContent) {
      $('p').each((_, el) => {
        const txt = $(el).text().replace(/\s+/g, ' ').trim();
        if (txt.length > 40 && !bodyParagraphs.includes(txt)) {
          bodyParagraphs.push(txt);
        }
      });
    }

    // Fallback 2: get readable text from body
    if (bodyParagraphs.length === 0) {
      const mainText = $('body')
        .text()
        .replace(/\s+/g, ' ')
        .trim();
      bodyParagraphs.push(mainText);
    }

    const bodyText = bodyParagraphs.join('\n\n');

    return NextResponse.json({
      title,
      text: bodyText,
      bodyText,
      ogDescription,
    });
  } catch (error: any) {
    console.error('Error parsing news:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse news URL.' },
      { status: 500 }
    );
  }
}
