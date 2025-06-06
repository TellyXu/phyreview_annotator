package main

import (
	"fmt"
	"regexp"
)

func main() {
	// 测试数据 - 模拟JSON中的数据
	testReviewDoc := `<review><meta>#0 - 2009-04-03 14:53:21 - Vitals</meta>I have been to many doctors with my problem but none have been so caring and wanted to see that my pain was under control until I went to her.  I was amazed at how fast everything was taken care of.  What a blessing!  </review>
<review><meta>#1 - 2010-02-22 21:44:59 - Vitals</meta>You are very good at localizing and reducing pain effectively</review>`

	fmt.Printf("Testing review doc length: %d\n", len(testReviewDoc))
	fmt.Printf("First 100 chars: %q\n", testReviewDoc[:min(100, len(testReviewDoc))])

	// 测试不同的正则表达式
	patterns := []string{
		`<review>`,                       // 简单测试
		`<meta>#(\d+)`,                   // 测试编号匹配
		`<review><meta>#(\d+).*?</meta>`, // 匹配meta部分
		`<review><meta>#(\d+).*?</meta>(.*?)</review>`,                      // 基本匹配
		`(?s)<review><meta>#(\d+).*?</meta>(.*?)</review>`,                  // 带DotAll模式
		`<review><meta>#(\d+) - ([^-]+) - ([^>]+)</meta>(.*?)</review>`,     // 修复日期时间匹配
		`(?s)<review><meta>#(\d+) - ([^-]+) - ([^>]+)</meta>(.*?)</review>`, // 带DotAll的修复版本
	}

	for i, pattern := range patterns {
		fmt.Printf("\n=== Testing pattern %d: %s ===\n", i+1, pattern)
		regex := regexp.MustCompile(pattern)
		matches := regex.FindAllStringSubmatch(testReviewDoc, -1)

		fmt.Printf("Found %d matches:\n", len(matches))
		for j, match := range matches {
			fmt.Printf("  Match %d: %d groups\n", j+1, len(match))
			for k, group := range match {
				if k == 0 {
					fmt.Printf("    Full match: %s\n", group[:min(50, len(group))]+"...")
				} else {
					fmt.Printf("    Group %d: %s\n", k, group)
				}
			}
		}
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
