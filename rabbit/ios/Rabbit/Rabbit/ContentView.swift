//
//  ContentView.swift
//  Rabbit
//
//  Created by jay on 6/10/26.
//

import SwiftUI
import WebKit

// rabbit 웹 앱 주소 — 시뮬레이터의 localhost는 Mac(pnpm dev)을 가리킨다.
// GCP 배포 후에는 Cloud Run URL로 교체.
private let rabbitURL = URL(string: "http://localhost:3000")!

struct ContentView: View {
    var body: some View {
        WebView(url: rabbitURL)
            .ignoresSafeArea(edges: .bottom)
    }
}

// WKWebView를 SwiftUI에서 쓰기 위한 래퍼
struct WebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default() // NextAuth 세션 쿠키 유지
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.allowsBackForwardNavigationGestures = true // 스와이프 뒤로가기
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}
}

#Preview {
    ContentView()
}
