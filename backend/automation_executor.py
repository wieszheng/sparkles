"""
自动化操作执行器
实现各种自动化操作的具体执行逻辑
"""

import asyncio
import time
import os
import json
from typing import Dict, Any, Optional, List, Tuple
import pyautogui


from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import psutil


class AutomationExecutor:
    """自动化操作执行器"""
    
    def __init__(self):
        self.driver: Optional[webdriver.Chrome] = None
        self.variables: Dict[str, Any] = {}
        self.screenshots_dir = "screenshots"
        self._ensure_screenshots_dir()
        
        # 配置 pyautogui
        pyautogui.FAILSAFE = True
        pyautogui.PAUSE = 0.1
    
    def _ensure_screenshots_dir(self):
        """确保截图目录存在"""
        if not os.path.exists(self.screenshots_dir):
            os.makedirs(self.screenshots_dir)
    
    async def execute_start_node(self, config: Dict[str, Any]) -> None:
        """执行开始节点 - 启动应用或浏览器"""
        app_name = config.get("appName", "").strip()
        wait_time = config.get("waitTime", 2000)
        
        # if app_name:
        #     if app_name.lower() in ["chrome", "browser", "浏览器"]:
        #         await self._start_browser()
        #     else:
        #         await self._start_application(app_name)
        
        await asyncio.sleep(int(wait_time) / 1000)
    
    async def _start_browser(self):
        """启动浏览器"""
        if self.driver is None:
            chrome_options = Options()
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            
            try:
                self.driver = webdriver.Chrome(options=chrome_options)
                self.driver.maximize_window()
                print("浏览器启动成功")
            except Exception as e:
                print(f"浏览器启动失败: {e}")
                raise
    
    async def _start_application(self, app_name: str):
        """启动指定应用程序"""
        try:
            # 在 Windows 上启动应用
            if os.name == 'nt':
                os.system(f'start "" "{app_name}"')
            else:
                os.system(f'open "{app_name}"' if os.name == 'posix' else f'xdg-open "{app_name}"')
            print(f"应用程序 {app_name} 启动成功")
        except Exception as e:
            print(f"应用程序启动失败: {e}")
            raise
    
    async def execute_click_node(self, config: Dict[str, Any]) -> None:
        """执行点击操作"""
        selector = config.get("selector", "").strip()
        click_type = config.get("clickType", "left")
        wait_time = config.get("waitTime", 1000)
        retry_count = config.get("retryCount", 3)
        
        success = False
        last_error = None
        
        for attempt in range(retry_count):
            try:
                if self.driver and selector.startswith(("//", "css:", "#", ".")):
                    # Web 元素点击
                    await self._click_web_element(selector, click_type)
                elif selector:
                    # 图像识别点击
                    await self._click_by_image_or_text(selector, click_type)
                else:
                    # 坐标点击
                    x = config.get("x", 0)
                    y = config.get("y", 0)
                    await self._click_coordinates(x, y, click_type)
                
                success = True
                break
                
            except Exception as e:
                last_error = e
                if attempt < retry_count - 1:
                    await asyncio.sleep(1)  # 重试前等待
        
        if not success:
            raise Exception(f"点击操作失败: {last_error}")
        
        await asyncio.sleep(wait_time / 1000)
    
    async def _click_web_element(self, selector: str, click_type: str):
        """点击 Web 元素"""
        if not self.driver:
            raise Exception("浏览器未启动")
        
        wait = WebDriverWait(self.driver, 10)
        
        if selector.startswith("//"):
            element = wait.until(EC.element_to_be_clickable((By.XPATH, selector)))
        elif selector.startswith("css:"):
            element = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, selector[4:])))
        elif selector.startswith("#"):
            element = wait.until(EC.element_to_be_clickable((By.ID, selector[1:])))
        elif selector.startswith("."):
            element = wait.until(EC.element_to_be_clickable((By.CLASS_NAME, selector[1:])))
        else:
            element = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, selector)))
        
        if click_type == "right":
            ActionChains(self.driver).context_click(element).perform()
        elif click_type == "double":
            ActionChains(self.driver).double_click(element).perform()
        else:
            element.click()
    
    async def _click_by_image_or_text(self, selector: str, click_type: str):
        """通过图像识别或文本查找点击"""
        # 截取当前屏幕
        screenshot = pyautogui.screenshot()
        
        try:
            # 尝试作为图像文件路径处理
            if os.path.exists(selector):
                location = pyautogui.locateOnScreen(selector, confidence=0.8)
                if location:
                    center = pyautogui.center(location)
                    await self._click_coordinates(center.x, center.y, click_type)
                    return
            
            # 尝试作为文本查找
            # 这里可以集成 OCR 库来识别文本
            # 暂时使用简单的图像匹配
            raise Exception(f"无法找到元素: {selector}")
            
        except Exception as e:
            raise Exception(f"图像识别失败: {e}")
    
    async def _click_coordinates(self, x: int, y: int, click_type: str):
        """点击指定坐标"""
        if click_type == "right":
            pyautogui.rightClick(x, y)
        elif click_type == "double":
            pyautogui.doubleClick(x, y)
        else:
            pyautogui.click(x, y)
    
    async def execute_input_node(self, config: Dict[str, Any]) -> None:
        """执行输入操作"""
        selector = config.get("selector", "").strip()
        text = config.get("text", "")
        clear_first = config.get("clearFirst", True)
        wait_time = config.get("waitTime", 1000)
        retry_count = config.get("retryCount", 3)
        
        success = False
        last_error = None
        
        for attempt in range(retry_count):
            try:
                if self.driver and selector.startswith(("//", "css:", "#", ".")):
                    # Web 元素输入
                    await self._input_web_element(selector, text, clear_first)
                else:
                    # 直接键盘输入
                    if clear_first:
                        pyautogui.hotkey('ctrl', 'a')  # 全选
                    pyautogui.write(text)
                
                success = True
                break
                
            except Exception as e:
                last_error = e
                if attempt < retry_count - 1:
                    await asyncio.sleep(1)
        
        if not success:
            raise Exception(f"输入操作失败: {last_error}")
        
        await asyncio.sleep(wait_time / 1000)
    
    async def _input_web_element(self, selector: str, text: str, clear_first: bool):
        """在 Web 元素中输入文本"""
        if not self.driver:
            raise Exception("浏览器未启动")
        
        wait = WebDriverWait(self.driver, 10)
        
        if selector.startswith("//"):
            element = wait.until(EC.element_to_be_clickable((By.XPATH, selector)))
        elif selector.startswith("css:"):
            element = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, selector[4:])))
        elif selector.startswith("#"):
            element = wait.until(EC.element_to_be_clickable((By.ID, selector[1:])))
        elif selector.startswith("."):
            element = wait.until(EC.element_to_be_clickable((By.CLASS_NAME, selector[1:])))
        else:
            element = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, selector)))
        
        if clear_first:
            element.clear()
        
        element.send_keys(text)
    
    async def execute_wait_node(self, config: Dict[str, Any]) -> None:
        """执行等待操作"""
        duration = config.get("duration", 1000)
        unit = config.get("unit", "milliseconds")
        wait_type = config.get("waitType", "fixed")
        
        if unit == "seconds":
            wait_seconds = duration
        else:
            wait_seconds = duration / 1000
        
        if wait_type == "random":
            # 随机等待时间（50%-150%）
            import random
            wait_seconds = wait_seconds * (0.5 + random.random())
        
        await asyncio.sleep(wait_seconds)
    
    async def execute_scroll_node(self, config: Dict[str, Any]) -> None:
        """执行滚动操作"""
        direction = config.get("direction", "down")
        distance = config.get("distance", 300)
        smooth = config.get("smooth", True)
        selector = config.get("selector", "").strip()
        
        if self.driver and selector:
            # Web 页面滚动
            await self._scroll_web_element(selector, direction, distance)
        else:
            # 系统级滚动
            await self._scroll_system(direction, distance, smooth)
    
    async def _scroll_web_element(self, selector: str, direction: str, distance: int):
        """滚动 Web 元素"""
        if not self.driver:
            raise Exception("浏览器未启动")
        
        scroll_script = f"""
        var element = document.querySelector('{selector}');
        if (element) {{
            element.scrollBy(0, {distance if direction == 'down' else -distance});
        }} else {{
            window.scrollBy(0, {distance if direction == 'down' else -distance});
        }}
        """
        
        self.driver.execute_script(scroll_script)
    
    async def _scroll_system(self, direction: str, distance: int, smooth: bool):
        """系统级滚动"""
        scroll_amount = distance // 10 if smooth else distance
        scroll_times = 10 if smooth else 1
        
        for _ in range(scroll_times):
            if direction == "down":
                pyautogui.scroll(-scroll_amount)
            elif direction == "up":
                pyautogui.scroll(scroll_amount)
            elif direction == "left":
                pyautogui.hscroll(-scroll_amount)
            elif direction == "right":
                pyautogui.hscroll(scroll_amount)
            
            if smooth:
                await asyncio.sleep(0.05)
    
    async def execute_screenshot_node(self, config: Dict[str, Any]) -> str:
        """执行截图操作"""
        filename = config.get("filename", f"screenshot_{int(time.time())}")
        full_screen = config.get("fullScreen", True)
        selector = config.get("selector", "").strip()
        format_type = config.get("format", "png")
        
        if not filename.endswith(f".{format_type}"):
            filename += f".{format_type}"
        
        filepath = os.path.join(self.screenshots_dir, filename)
        
        if self.driver and selector and not full_screen:
            # Web 元素截图
            await self._screenshot_web_element(selector, filepath)
        else:
            # 全屏截图
            screenshot = pyautogui.screenshot()
            screenshot.save(filepath)
        
        return filepath
    
    async def _screenshot_web_element(self, selector: str, filepath: str):
        """截图 Web 元素"""
        if not self.driver:
            raise Exception("浏览器未启动")
        
        wait = WebDriverWait(self.driver, 10)
        
        if selector.startswith("//"):
            element = wait.until(EC.presence_of_element_located((By.XPATH, selector)))
        elif selector.startswith("css:"):
            element = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector[4:])))
        elif selector.startswith("#"):
            element = wait.until(EC.presence_of_element_located((By.ID, selector[1:])))
        elif selector.startswith("."):
            element = wait.until(EC.presence_of_element_located((By.CLASS_NAME, selector[1:])))
        else:
            element = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
        
        element.screenshot(filepath)
    
    async def execute_condition_node(self, config: Dict[str, Any]) -> bool:
        """执行条件判断"""
        selector = config.get("selector", "").strip()
        operator = config.get("operator", "exists")
        value = config.get("value", "")
        attribute = config.get("attribute", "text")
        wait_time = config.get("waitTime", 5000)
        retry_count = config.get("retryCount", 3)
        
        for attempt in range(retry_count):
            try:
                if self.driver and selector.startswith(("//", "css:", "#", ".")):
                    # Web 元素条件判断
                    return await self._check_web_element_condition(
                        selector, operator, value, attribute, wait_time
                    )
                else:
                    # 图像或文本条件判断
                    return await self._check_image_condition(selector, operator, value)
                    
            except Exception as e:
                if attempt < retry_count - 1:
                    await asyncio.sleep(1)
                else:
                    # 最后一次尝试失败，根据操作符返回默认值
                    return operator == "not_exists"
        
        return False
    
    async def _check_web_element_condition(
        self, selector: str, operator: str, value: str, attribute: str, wait_time: int
    ) -> bool:
        """检查 Web 元素条件"""
        if not self.driver:
            raise Exception("浏览器未启动")
        
        try:
            wait = WebDriverWait(self.driver, wait_time / 1000)
            
            if selector.startswith("//"):
                element = wait.until(EC.presence_of_element_located((By.XPATH, selector)))
            elif selector.startswith("css:"):
                element = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector[4:])))
            elif selector.startswith("#"):
                element = wait.until(EC.presence_of_element_located((By.ID, selector[1:])))
            elif selector.startswith("."):
                element = wait.until(EC.presence_of_element_located((By.CLASS_NAME, selector[1:])))
            else:
                element = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
            
            if operator == "exists":
                return element is not None
            elif operator == "not_exists":
                return False  # 如果找到了元素，说明存在
            elif operator == "visible":
                return element.is_displayed()
            elif operator == "enabled":
                return element.is_enabled()
            elif operator == "contains":
                if attribute == "text":
                    return value.lower() in element.text.lower()
                else:
                    attr_value = element.get_attribute(attribute) or ""
                    return value.lower() in attr_value.lower()
            elif operator == "equals":
                if attribute == "text":
                    return element.text.strip() == value.strip()
                else:
                    attr_value = element.get_attribute(attribute) or ""
                    return attr_value.strip() == value.strip()
            
        except Exception:
            # 元素不存在或其他错误
            return operator == "not_exists"
        
        return False
    
    async def _check_image_condition(self, selector: str, operator: str, value: str) -> bool:
        """检查图像条件"""
        try:
            if operator == "exists":
                if os.path.exists(selector):
                    location = pyautogui.locateOnScreen(selector, confidence=0.8)
                    return location is not None
                else:
                    # 尝试文本识别（需要 OCR 库）
                    return False
            elif operator == "not_exists":
                if os.path.exists(selector):
                    location = pyautogui.locateOnScreen(selector, confidence=0.8)
                    return location is None
                else:
                    return True
        except Exception:
            return operator == "not_exists"
        
        return False
    
    async def execute_loop_node(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """执行循环节点"""
        loop_type = config.get("type", "count")
        count = config.get("count", 1)
        max_iterations = config.get("maxIterations", 10)
        wait_time = config.get("waitTime", 1000)
        
        should_loop = False
        iteration_count = 0
        
        if loop_type == "count":
            should_loop = count > 0
            iteration_count = min(count, max_iterations)
        elif loop_type == "condition":
            # 检查循环条件
            condition_config = {
                "selector": config.get("selector", ""),
                "operator": config.get("operator", "exists"),
                "value": config.get("value", ""),
                "attribute": config.get("attribute", "text"),
                "waitTime": 2000,
                "retryCount": 1
            }
            should_loop = await self.execute_condition_node(condition_config)
            iteration_count = 1 if should_loop else 0
        elif loop_type == "foreach":
            # 遍历元素（简化实现）
            selector = config.get("selector", "")
            if self.driver and selector:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                iteration_count = min(len(elements), max_iterations)
                should_loop = iteration_count > 0
            else:
                should_loop = False
                iteration_count = 0
        
        await asyncio.sleep(wait_time / 1000)
        
        return {
            "shouldLoop": should_loop,
            "iterationCount": iteration_count
        }
    
    async def execute_swipe_node(self, config: Dict[str, Any]) -> None:
        """执行滑动操作"""
        direction = config.get("direction", "up")
        distance = config.get("distance", 200)
        duration = config.get("duration", 500)
        start_x = config.get("startX", 0)
        start_y = config.get("startY", 0)
        
        # 获取屏幕尺寸
        screen_width, screen_height = pyautogui.size()
        
        # 如果没有指定起始坐标，使用屏幕中心
        if start_x == 0 and start_y == 0:
            start_x = screen_width // 2
            start_y = screen_height // 2
        
        # 计算结束坐标
        if direction == "up":
            end_x, end_y = start_x, start_y - distance
        elif direction == "down":
            end_x, end_y = start_x, start_y + distance
        elif direction == "left":
            end_x, end_y = start_x - distance, start_y
        elif direction == "right":
            end_x, end_y = start_x + distance, start_y
        else:
            end_x = config.get("endX", start_x)
            end_y = config.get("endY", start_y)
        
        # 执行拖拽操作
        pyautogui.drag(end_x - start_x, end_y - start_y, duration=duration/1000, button='left')
    
    async def execute_close_node(self, config: Dict[str, Any]) -> None:
        """执行关闭操作"""
        method = config.get("method", "window")
        target = config.get("target", "").strip()
        confirm_close = config.get("confirmClose", False)
        
        # if method == "browser" and self.driver:
        #     if confirm_close:
        #         # 处理可能的确认对话框
        #         try:
        #             alert = self.driver.switch_to.alert
        #             alert.accept()
        #         except:
        #             pass
        #
        #     if target:
        #         # 关闭特定标签页
        #         for handle in self.driver.window_handles:
        #             self.driver.switch_to.window(handle)
        #             if target.lower() in self.driver.title.lower():
        #                 self.driver.close()
        #                 break
        #     else:
        #         # 关闭浏览器
        #         self.driver.quit()
        #         self.driver = None
        #
        # elif method == "application" and target:
        #     # 关闭指定应用程序
        #     for proc in psutil.process_iter(['pid', 'name']):
        #         if target.lower() in proc.info['name'].lower():
        #             proc.terminate()
        #             break
        #
        # elif method == "window":
        #     # 关闭当前窗口
        #     pyautogui.hotkey('alt', 'f4')  # Windows
        #     # 或者 pyautogui.hotkey('cmd', 'w')  # macOS
    
    def cleanup(self):
        """清理资源"""
        if self.driver:
            try:
                self.driver.quit()
            except:
                pass
            self.driver = None