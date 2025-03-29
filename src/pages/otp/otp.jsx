import React, { useState } from "react";
import { Button, Flex, Form, Input } from "antd";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
function Otp() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const handleChange = (e) => {
    setEmail(e.target.value); // Lưu giá trị email vào state
  };
  const handleOtp = async () => {
    try {
      const response = await fetch(
        "http://localhost:3055/api/v1/users/password/forgot",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email, // ✅ Lấy từ form
          }),
          credentials: "include",
        }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(`Lỗi ${result.code}: ${result.message}`);
      }

      if (result) {
        toast.success("Vui lòng check mail để lấy OTP");
      }
    } catch (error) {
      toast.error(`Đăng nhập thất bại: ${error.message}`);
    }
  };
  const onFinish = async (values) =>{
    console.log(values)
    try{
        const response  = await fetch("http://localhost:3055/api/v1/users/password/otp",
            {
                method: "POST",
                headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email: values.email,
            otp: values.otp,
          }),
            }
        )
        const result  = await response.json();
        if (!response.ok) {
            throw new Error(`Lỗi ${result.code}: ${result.message}`);
          }
    
          if (result) {
            toast.success("Xác nhận thành công");
            navigate("/reset-password")
          }
    }catch (error) {
        toast.error(`Đăng nhập thất bại: ${error.message}`);
      }
  }
  return (
    <div className="mt-[200px] ml-[500px] mr-[500px]">
      <h1 className="mb-[50px] text-4xl font-bold text-center text-[#314876]">
        QUÊN MẬT KHẨU
      </h1>
      <Form
        name="wrap"
        labelCol={{ flex: "110px" }}
        labelAlign="left"
        labelWrap
        wrapperCol={{ flex: 1 }}
        colon={false}
        style={{ maxWidth: 600 }}
        onFinish={onFinish}
      >
        <Form.Item
          label="Nhập email"
          labelCol={{ span: 6 }}
          name="email"
          rules={[{ required: true, message: "Vui lòng nhập email" }]}
        >
          <div className="flex items-center gap-2 w-[400px]">
            <Input
              className="flex-1"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={handleChange}
            />
            <Button type="primary" onClick={handleOtp}>
              Lấy mã OTP
            </Button>
          </div>
        </Form.Item>
        <Form.Item
          label="Nhập mã OTP"
          name="otp"
          labelCol={{ span: 6 }}
          rules={[{ required: true }]}
        >
          <div className="flex items-center gap-2 w-[290px]">
            <Input placeholder="Nhập mã OTP của bạn" />
          </div>
        </Form.Item>

        <Form.Item label=" ">
          <Button type="primary" htmlType="submit" className="ml-[20px]">
            Xác nhận
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
export default Otp;
