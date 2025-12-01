// src/components/OrderForm.tsx
import React, { useEffect } from "react";
import { useOrderEntry } from "@orderly.network/hooks";
import { OrderSide, OrderType } from "@orderly.network/types";

interface OrderFormProps {
  symbol: string;
}

const OrderForm: React.FC<OrderFormProps> = ({ symbol }) => {
  // useOrderEntry xử lý toàn bộ logic form
  const {
    submit, // Hàm gửi lệnh
    formattedOrder, // Dữ liệu lệnh hiện tại
    setValue, // Hàm set giá trị (price, quantity)
    maxQty, // Số lượng tối đa có thể mua/bán
    freeCollateral, // Số dư khả dụng
    markPrice, // Giá mark hiện tại
    estLeverage, // Đòn bẩy ước tính
    estLiqPrice, // Giá thanh lý ước tính
    isMutating, // Trạng thái đang gửi lệnh
    metaState, // Chứa errors (lỗi validation)
  } = useOrderEntry(symbol, {
    watchOrderbook: true, // Tự động lấy giá từ orderbook để tính toán
  });

  // Set mặc định order type là LIMIT khi component mount
  useEffect(() => {
    setValue("order_type", OrderType.LIMIT);
    setValue("side", OrderSide.BUY);
  }, [symbol, setValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submit();
      alert("Đặt lệnh thành công!");
    } catch (err) {
      console.error(err);
      // Lỗi chi tiết nằm trong metaState.errors
      alert("Lỗi đặt lệnh. Kiểm tra lại thông tin.");
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <h3 className="text-lg font-bold mb-4 text-white">Đặt Lệnh</h3>

      {/* Tab Mua/Bán */}
      <div className="flex mb-4 bg-gray-900 rounded p-1">
        <button
          className={`flex-1 py-2 rounded text-sm font-bold transition-colors ${
            formattedOrder.side === OrderSide.BUY
              ? "bg-green-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setValue("side", OrderSide.BUY)}
        >
          Mua (Long)
        </button>
        <button
          className={`flex-1 py-2 rounded text-sm font-bold transition-colors ${
            formattedOrder.side === OrderSide.SELL
              ? "bg-red-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setValue("side", OrderSide.SELL)}
        >
          Bán (Short)
        </button>
      </div>

      <div className="text-xs text-gray-400 mb-2 flex justify-between">
        <span>Khả dụng: {freeCollateral.toFixed(2)} USDC</span>
        <span>Max: {maxQty.toFixed(4)}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Chọn loại lệnh */}
        <div>
          <label
            htmlFor="order-type"
            className="block text-xs text-gray-400 mb-1"
          >
            Loại lệnh
          </label>
          <select
            id="order-type"
            className="w-full bg-gray-700 text-white p-2 rounded text-sm border border-gray-600 focus:border-blue-500 outline-none"
            value={formattedOrder.order_type}
            onChange={(e) =>
              setValue("order_type", e.target.value as OrderType)
            }
          >
            <option value={OrderType.LIMIT}>Limit</option>
            <option value={OrderType.MARKET}>Market</option>
          </select>
        </div>

        {/* Input Giá (Chỉ hiện khi là Limit) */}
        {formattedOrder.order_type === OrderType.LIMIT && (
          <div>
            <label
              htmlFor="order-price"
              className="block text-xs text-gray-400 mb-1"
            >
              Giá (USDC)
            </label>
            <input
              id="order-price"
              type="number"
              step="0.01"
              className="w-full bg-gray-900 text-white p-2 rounded text-sm border border-gray-600 focus:border-blue-500 outline-none"
              placeholder={markPrice?.toFixed(2) || "0.00"}
              value={formattedOrder.order_price || ""}
              onChange={(e) => setValue("order_price", e.target.value)}
            />
          </div>
        )}

        {/* Input Số lượng */}
        <div>
          <label
            htmlFor="order-quantity"
            className="block text-xs text-gray-400 mb-1"
          >
            Số lượng ({symbol.split("_")[1]})
          </label>
          <input
            id="order-quantity"
            type="number"
            step="0.0001"
            className="w-full bg-gray-900 text-white p-2 rounded text-sm border border-gray-600 focus:border-blue-500 outline-none"
            placeholder="0.0000"
            value={formattedOrder.order_quantity || ""}
            onChange={(e) => setValue("order_quantity", e.target.value)}
          />
        </div>

        {/* Thông tin ước tính */}
        <div className="bg-gray-900 p-2 rounded text-xs text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Đòn bẩy ước tính:</span>
            <span className="text-white">
              {estLeverage ? `${estLeverage.toFixed(1)}x` : "--"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Giá thanh lý:</span>
            <span className="text-orange-500">
              {estLiqPrice ? estLiqPrice.toFixed(2) : "--"}
            </span>
          </div>
        </div>

        {/* Hiển thị lỗi nếu có */}
        {metaState.errors && Object.keys(metaState.errors).length > 0 && (
          <div className="text-red-500 text-xs">
            {Object.values(metaState.errors)[0]?.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isMutating}
          className={`w-full py-3 rounded font-bold text-white transition-opacity ${
            isMutating ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
          } ${
            formattedOrder.side === OrderSide.BUY
              ? "bg-green-600"
              : "bg-red-600"
          }`}
        >
          {isMutating
            ? "Đang gửi..."
            : formattedOrder.side === OrderSide.BUY
            ? "MUA / LONG"
            : "BÁN / SHORT"}
        </button>
      </form>
    </div>
  );
};

export default OrderForm;
