//
//  ContentView.swift
//  Rabbit
//
//  Created by jay on 6/10/26.
//

import SwiftUI
import WebKit

// rabbit 웹 앱 주소 — GCP 배포 후에는 Cloud Run URL 하나로 교체.
#if targetEnvironment(simulator)
// 시뮬레이터: localhost = Mac(pnpm dev)
private let rabbitURL = URL(string: "http://localhost:3100")!
#else
// 실기기: localhost는 폰 자신 → Mac의 LAN IP 사용 (같은 Wi-Fi 필수)
// IP 확인: Mac에서 `ipconfig getifaddr en0`
private let rabbitURL = URL(string: "http://192.168.0.34:3100")!
#endif

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
