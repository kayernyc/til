# H1 tags and user agents

I'm currently working with typography for one of my personal projects so I pulled [Chris Bracco's HTML5 test page](https://github.com/cbracco/html5-test-page) and started playing with it. 

After stripping most of NextJS's default CSS, I noticed that my `<h1>` was showing up much smaller than my `<h2>`. Of course, I thought I had missed some errant reset in the project, but inspecting in Chrome pointed at the user agent. 

How did I never know that in 
```html
  <article>
  <aside>
  <nav>
  <section>
```

`<h1>` actually gets smaller, progressively with nesting?

```html
  <article>
    <h1>I'm smaller than expected</h1>
      <article>
        <h1>I'm even smaller than expected</h1>
          <article>
            <h1>I'm teeny tiny</h1>
        </article>
      </article>
  </article>
```
This is in the [spec](https://html.spec.whatwg.org/multipage/rendering.html#sections-and-headings), but I didn't find an explanation on that page. Instead I found an [blog entry](https://blog.whatwg.org/category/syntax) from 
2012 about semantic markup that clearly shows multiple `<h1>` tags in a layout, and each `<section>` is allowed its own `<h1>`. This adds a new wrinkle both to my understanding of header hierarchy and how to set type in `html`.