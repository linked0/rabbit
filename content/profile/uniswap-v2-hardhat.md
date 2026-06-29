---
layout: post
title: "Uniswap V2 to Hardhat"
date: 2024-01-01 00:00:05 +0900
description: You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. # Add post description (optional)
img: uniswap-hardhat.png
tags: [Uniswap, DEX] # add tag
---
Analysis of Uniswap's smart contracts, merging of v2-core and v2-periphery, and migration to Hardhat for improved development and testing.

<div style="text-align: right;">
    <a href="#for-korean-users">Read the Korean version here</a> 
</div>

### Overview
1. Examined the structure and functionality of Uniswap v2-core and v2-periphery smart contracts
2. Combined the Uniswap v2-core and v2-periphery repositories into a unified project
3. Transitioned the consolidated Uniswap project to the Hardhat development environment, enhancing testing efficiency
4. Conducted this project for my own development and testing

### Introduce Project

 | Item                      | Description                                                                                    |
 |---------------------------| ---------------------------------------------------------------------------------------------- |
 | Project Duration          | 2024.01 ~ 2024.03(3 months)                                                                    |
 | Team Composition<br>(My Role) | Contract development: 1 member <br> (Contract development: 100%)                               |
 | Project Details           | Understanding token swap algorithm <br> Setting up Hardhat environment                         |
 | Major Tasks      | Smart contract analysis <br> Development of test code                                          |
 | Technologies Used         | Solidity, TypeScript, JavaScript, Hardhat                                                      |
 | GitHub and Website        | [https://github.com/linked0/uniswap-v2-hardhat](https://github.com/linked0/uniswap-v2-hardhat) |


---
## Korean Version
Uniswap 스마트 컨트랙트 분석, v2-core와 v2-periphery 통합, 개발 및 테스트 효율성을 향상시키기 위한 Hardhat으로의 마이그레이션

### Overview
1. Uniswap v2-core와 v2-periphery 스마트 계약의 구조와 기능을 분석함
2. Uniswap v2-core와 v2-periphery 레포지토리를 하나의 프로젝트로 병합하여 코드베이스를 통합함
3. 통합된 Uniswap 프로젝트를 Hardhat 개발 환경으로 마이그레이션하여 개발 및 테스트의 효율성을 향상시킴
4. 개인적인 개발 및 테스트 목적으로 이 프로젝트를 수행함
   
### Introduce Project

| 항목            | 내용                                                                                               |
|---------------| -------------------------------------------------------------------------------------------------- |
| 작업 기간         | 2024.01 ~ 2024.03(3개월)                                                                           |
| 인력 구성<br>(역할)     | 컨트랙트 개발 1 명 (컨트랙트 개발 100%)                                                            |
| 프로젝트 내용       | 토큰 스왑 알고리즘 이해 <br> Hardhat 환경 설정                                                     |
| 주요 업무 | 스마트 컨트랙트 분석 <br> 테스트 코드 개발                                                         |
| 사용 기술         | Solidity, TypeScript, JavaScript, Hardhat                                                          |
| 깃헙 및 사이트      | [https://github.com/linked0/smart-contract-hacking](https://github.com/linked0/uniswap-v2-hardhat) |

