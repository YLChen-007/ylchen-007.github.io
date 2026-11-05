export default {
  slug: 'cpython-htmlparser-quadratic-dos',
  title: '从一次 feed() 到平方级开销：CPython HTMLParser DoS 源码分析',
  description: '分析 CVE-2026-15308 中未闭合 HTML 声明如何在增量解析时被反复复制和扫描，并通过有界网络 EXP 对比修复前后的行为。',
  category: 'Vulnerability analysis',
  published: '2026-11-05',
  dateLabel: '2026 年 11 月 5 日',
  readingTime: '约 12 分钟',
  tags: ['CPython', 'Algorithmic DoS', 'HTMLParser'],
  gistUrl: 'https://gist.github.com/YLChen-007/a5f267d2d8769366baaa32de6386de6e',
  toc: [
    ['scenario', '应用场景'],
    ['threat-model', '威胁模型'],
    ['source-trace', '源码调用链'],
    ['complexity', '复杂度推导'],
    ['experiment', '网络 EXP'],
    ['fix', '补丁思路'],
    ['conclusion', '结论']
  ],
  content: `
    <section id="scenario">
      <p class="article-lead">如果一个链接预览服务边下载网页、边把小块文本交给同一个 <code>HTMLParser</code>，攻击者控制的未闭合声明就可能让客户端反复处理全部历史输入。问题不在恶意脚本，也不是正则灾难性回溯，而是增量解析状态管理造成的算法复杂度拒绝服务。</p>
      <h2>一个链接预览请求，为什么会占住 CPU？</h2>
      <p>聊天、笔记和内容管理系统经常根据用户提交的 URL 生成预览。简化后的业务代码通常会持续读取响应，再把每个数据块送入解析器：</p>
      <pre><code>parser = PreviewParser()

for text_chunk in download_page_in_chunks(url):
    parser.feed(text_chunk)

parser.close()</code></pre>
      <p>如果远端网页以 <code>&lt;![CDATA[</code> 开始，随后不断返回普通字符，却迟迟不返回 <code>]]&gt;</code>，存在漏洞的实现会保留整段未完成输入。下一块数据到来后，它既复制此前的缓冲区，又重新搜索结束标记。输入越碎，同一段历史数据被处理的次数越多。</p>
      <aside class="article-callout"><strong>边界说明</strong><p>这是一个用于解释风险的教学场景，不代表某个真实产品已经发生过安全事件。漏洞能否被远程利用，取决于不可信数据是否真正到达这条增量解析路径。</p></aside>
    </section>

    <section id="threat-model">
      <h2>漏洞概况与威胁模型</h2>
      <p><a href="https://www.cve.org/CVERecord?id=CVE-2026-15308">CVE-2026-15308</a> 影响 Python 标准库 <code>html.parser.HTMLParser</code>。PSF 的记录将其归类为 CWE-400，CVSS v4.0 为 8.7（High）。官方跟踪记录为 <a href="https://github.com/python/cpython/issues/153030">issue #153030</a>，修复位于 <a href="https://github.com/python/cpython/pull/153031">PR #153031</a>。</p>
      <div class="table-wrap"><table>
        <thead><tr><th>分支</th><th>受影响范围</th><th>首个修复版本</th></tr></thead>
        <tbody>
          <tr><td>3.10</td><td><code>&lt; 3.10.21</code></td><td>3.10.21</td></tr>
          <tr><td>3.11</td><td><code>&gt;= 3.11.0, &lt; 3.11.16</code></td><td>3.11.16</td></tr>
          <tr><td>3.12</td><td><code>&gt;= 3.12.0, &lt; 3.12.14</code></td><td>3.12.14</td></tr>
          <tr><td>3.13</td><td><code>&gt;= 3.13.0, &lt; 3.13.15</code></td><td>3.13.15</td></tr>
          <tr><td>3.14</td><td><code>&gt;= 3.14.0, &lt; 3.14.7</code></td><td>3.14.7</td></tr>
          <tr><td>3.15 预发布版</td><td><code>&gt;= 3.15.0a1, &lt; 3.15.0b4</code></td><td>3.15.0b4</td></tr>
        </tbody>
      </table></div>
      <p>并非所有 Python 应用都能被远程攻击。攻击链需要同时满足以下条件：</p>
      <ol>
        <li>攻击者能够影响交给 <code>HTMLParser</code> 的文本；</li>
        <li>应用把输入拆成许多小块，并复用同一个解析器实例；</li>
        <li>输入包含长时间不闭合的 CDATA、注释、声明、标签或 RAWTEXT 结构；</li>
        <li>应用缺少严格的解码后总长度、执行时间、并发量或进程隔离限制。</li>
      </ol>
      <p><code>feed()</code> 的边界由应用的读取方式决定，不能直接等同于一个 TCP 包或 HTTP chunk。即使每个请求都创建新的解析器，只要该实例在请求内接收了大量小块，仍可能触发问题。</p>
    </section>

    <section id="source-trace">
      <h2>源码追踪：未闭合 CDATA 如何被反复处理？</h2>
      <p>以 CPython <a href="https://github.com/python/cpython/blob/v3.15.0b1/Lib/html/parser.py">v3.15.0b1 的 <code>Lib/html/parser.py</code></a> 为基线。存在漏洞的 <code>feed()</code> 每次都会直接拼接字符串，并立即进入解析：</p>
      <pre><code>self.rawdata = self.rawdata + data
self.goahead(0)</code></pre>
      <p><code>goahead()</code> 从位置 0 开始。遇到 <code>&lt;!</code> 后进入 <code>parse_html_declaration()</code>，CDATA 分支搜索结束标记：</p>
      <pre><code>j = rawdata.find("]]>", i + 9)
if j &lt; 0:
    return -1</code></pre>
      <p><code>-1</code> 表示当前数据还不完整，需要等待后续输入。回到 <code>goahead()</code> 后循环退出；由于解析位置仍为 0，最后的 <code>rawdata[i:]</code> 保留了整个未完成结构。</p>
      <div class="code-flow" aria-label="Vulnerable incremental parsing flow">
        <span>feed(data)</span><b aria-hidden="true">→</b><span>复制 rawdata</span><b aria-hidden="true">→</b><span>goahead(0)</span><b aria-hidden="true">→</b><span>find("]]>")</span><b aria-hidden="true">→</b><span>返回 -1，全部保留</span>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>调用</th><th><code>rawdata</code> 长度</th><th>搜索起点</th><th>保留内容</th></tr></thead>
        <tbody>
          <tr><td>前缀</td><td>9</td><td>9</td><td>全部 9 字符</td></tr>
          <tr><td>第 1 个数据块</td><td>73</td><td>9</td><td>前缀 + 64 字符</td></tr>
          <tr><td>第 2 个数据块</td><td>137</td><td>9</td><td>前缀 + 128 字符</td></tr>
          <tr><td>第 3 个数据块</td><td>201</td><td>9</td><td>前缀 + 192 字符</td></tr>
        </tbody>
      </table></div>
    </section>

    <section id="complexity">
      <h2>为什么是 O(N²)？</h2>
      <p>令有效载荷总长度为 <em>N</em>，固定块大小为 <em>C</em>，调用次数为 <em>M = N/C</em>。第 <em>k</em> 次输入后，缓冲区约为 <em>kC</em> 字符。漏洞路径产生两份同阶的重复工作：</p>
      <ul>
        <li><strong>重复复制：</strong>Python 字符串不可变，<code>rawdata + data</code> 每次都要复制累计缓冲区；</li>
        <li><strong>重复搜索：</strong>结束标记不存在时，<code>find()</code> 每次都要重新搜索累计缓冲区。</li>
      </ul>
      <div class="equation" role="img" aria-label="T equals theta of C plus 2C through MC, equals theta of N squared divided by C">T = Θ(C + 2C + ··· + MC) = Θ(CM²) = Θ(N² / C)</div>
      <p>当应用使用固定大小的读取块，即 <em>C</em> 是常数时，<strong>T(N) = Θ(N²)</strong>。相同内容如果一次性传给 <code>feed()</code>，只需要有限次复制和搜索，成本接近 O(N)。</p>
      <p>这里应区分累计工作量和峰值内存：扫描与复制的累计处理量可以达到 O(N²)，某一时刻保留的 <code>rawdata</code> 大小仍约为 O(N)。</p>
    </section>

    <section id="experiment">
      <h2>网络 EXP：服务端到 Python 解析客户端</h2>
      <p>为了验证真实数据流，实验使用一个有界恶意 HTTP 服务端和两个不同补丁版本的 Python 客户端。完整脚本位于 <a href="https://gist.github.com/YLChen-007/a5f267d2d8769366baaa32de6386de6e">Secret Gist</a>。</p>
      <pre><code>exp_server.py（HTTP 服务端）
        ↓ Compose 内部网络
urllib 客户端每次 read(64)
        ↓
exp_client.py 调用 HTMLParser.feed()</code></pre>
      <p>服务端的 <code>/normal</code> 返回 1,280,000 字节普通文本；<code>/exp</code> 返回 <code>&lt;![CDATA[</code>、20,000 个 64 字节数据块，最后再发送 <code>]]&gt;</code>。最终闭合保证实验能够有界退出，CPU 开销来自闭合前的 20,000 次增量解析。</p>
      <div class="table-wrap"><table>
        <thead><tr><th>客户端</th><th>响应</th><th>接收字节</th><th><code>feed()</code> 次数</th><th>CPU 时间</th></tr></thead>
        <tbody>
          <tr><td>Python 3.14.4</td><td>正常正文</td><td>1,280,000</td><td>20,000</td><td>0.026601 s</td></tr>
          <tr class="result-vulnerable"><td>Python 3.14.4</td><td>恶意 CDATA</td><td>1,280,012</td><td>20,001</td><td>3.159104 s</td></tr>
          <tr><td>Python 3.14.7</td><td>相同恶意响应</td><td>1,280,012</td><td>20,001</td><td>0.027204 s</td></tr>
        </tbody>
      </table></div>
      <div class="result-grid">
        <div><strong>118.76×</strong><span>3.14.4 恶意响应 / 正常响应</span></div>
        <div><strong>116.13×</strong><span>3.14.4 / 3.14.7 相同恶意响应</span></div>
      </div>
      <p>两个版本收到完全相同的恶意响应，差异落在解析器实现，而不是服务端数据。客户端的 <code>response.read(64)</code> 决定 <code>feed()</code> 边界；即使 TCP 合并服务端写入，应用仍以最多 64 字节为单位调用解析器。</p>
      <aside class="article-callout"><strong>实验隔离</strong><p>Compose 网络设置为 <code>internal: true</code>，没有宿主端口映射，客户端地址固定为内部服务。脚本不接受外部目标参数，结束时会清理容器和网络。</p></aside>
    </section>

    <section id="fix">
      <h2>补丁为什么等待缓冲区翻倍？</h2>
      <p><a href="https://github.com/python/cpython/commit/bcf98ddbc40ec9b3ee87da0124a5660b19b7e606">主分支修复</a>增加了 <code>_pending</code>、<code>_pending_len</code> 和 <code>_parse_threshold</code>。新数据先进入列表；只有积累到阈值后才合并并重试解析。如果本轮没有消费任何输入，阈值被设为当前缓冲区长度，也就是等到缓冲区大约翻倍后再扫描。</p>
      <div class="equation" role="img" aria-label="One plus two plus four through N is less than two N">1 + 2 + 4 + ··· + N &lt; 2N</div>
      <p>重试规模从线性序列变为几何序列，重复搜索和拼接的累计工作被压回摊销 O(N)。如果解析取得进展，阈值恢复为 1；<code>close()</code> 则会先合并剩余待处理数据，再完成 EOF 解析。</p>
    </section>

    <section id="conclusion">
      <h2>结论</h2>
      <p>审计增量解析器时，不能只看一次完整解析的复杂度。更重要的问题是：未完成输入如何保存、下一轮从哪里开始，以及没有取得进展时何时再次复制和扫描历史数据。</p>
      <p>本漏洞中，<code>return -1</code>、<code>rawdata[i:]</code> 和每次 <code>feed()</code> 立即重试，单独看都合理；组合后却让固定小块输入产生 O(N²) 的累计工作。修复没有取消增量解析，而是通过暂存数据和指数退避式阈值，把无进展重试恢复到摊销 O(N)。</p>
      <h3>参考资料与致谢</h3>
      <ul class="reference-list">
        <li><a href="https://www.cve.org/CVERecord?id=CVE-2026-15308">CVE-2026-15308 官方记录</a></li>
        <li><a href="https://github.com/python/cpython/issues/153030">CPython issue #153030</a></li>
        <li><a href="https://github.com/python/cpython/pull/153031">CPython PR #153031</a></li>
        <li><a href="https://github.com/python/cpython/blob/v3.15.0b1/Lib/html/parser.py">CPython v3.15.0b1 源码</a></li>
        <li><a href="https://gist.github.com/YLChen-007/a5f267d2d8769366baaa32de6386de6e">有界网络 EXP</a></li>
      </ul>
      <p class="article-credit">CVE 记录将 Edward-x（YLChen-007）列为报告者，Serhiy Storchaka 列为修复开发者，Gregory P. Smith 列为修复审阅者，Seth Larson 列为协调者。</p>
    </section>
  `
};
