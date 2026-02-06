import { format } from 'date-fns';

const InvoicePreview = ({ invoice, settings = null }) => {
  if (!invoice) return null;

  return (
    <div className="bg-white dark:bg-gray-900 p-8 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="mb-8">
        {settings?.logo && (
          <img
            src={`/api/uploads/${settings.logo}`}
            alt="Logo"
            className="h-16 mb-4"
            onError={(e) => {
              console.error('Error loading logo in preview:', settings.logo);
              e.target.style.display = 'none';
            }}
          />
        )}
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          {settings?.homestayName || 'Susan Homestay'}
        </h1>
        {settings?.address && (
          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
            {settings.address}
          </p>
        )}
      </div>

      {/* Invoice Info */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Invoice
          </h2>
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Invoice Number:</span>{' '}
              <span className="text-gray-800 dark:text-white">
                {invoice.invoiceNumber}
              </span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Date:</span>{' '}
              <span className="text-gray-800 dark:text-white">
                {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          Bill To:
        </h3>
        <div className="text-gray-600 dark:text-gray-400">
          <p className="font-semibold text-gray-800 dark:text-white">
            {invoice.customer.name}
          </p>
          <p>{invoice.customer.email}</p>
          <p>{invoice.customer.phone}</p>
          {invoice.customer.address && <p>{invoice.customer.address}</p>}
          {invoice.customerGstNumber && (
            <p className="mt-2">
              <span className="font-semibold">Customer GST:</span> {invoice.customerGstNumber}
            </p>
          )}
        </div>
      </div>

      {/* Stay Details */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          Stay Details:
        </h3>
        <div className="text-gray-600 dark:text-gray-400 space-y-1">
          {invoice.stayDetails?.homeId && (
            <p>
              <span className="font-semibold">Home:</span>{' '}
              {invoice.stayDetails.homeId.name} ({invoice.stayDetails.homeId.bhk})
            </p>
          )}
          {invoice.stayDetails?.checkInDate && (
            <p>
              <span className="font-semibold">Check-in:</span>{' '}
              {format(new Date(invoice.stayDetails.checkInDate), 'MMM dd, yyyy HH:mm')}
            </p>
          )}
          {invoice.stayDetails?.checkOutDate && (
            <p>
              <span className="font-semibold">Check-out:</span>{' '}
              {format(new Date(invoice.stayDetails.checkOutDate), 'MMM dd, yyyy HH:mm')}
            </p>
          )}
          {invoice.stayDetails?.checkInDate && invoice.stayDetails?.checkOutDate && (
            <p>
              <span className="font-semibold">Duration:</span>{' '}
              {Math.ceil(
                (new Date(invoice.stayDetails.checkOutDate) - new Date(invoice.stayDetails.checkInDate)) /
                  (1000 * 60 * 60 * 24)
              )}{' '}
              day(s)
            </p>
          )}
          <p>
            <span className="font-semibold">Adults:</span> {invoice.stayDetails?.adults || 0},{' '}
            <span className="font-semibold">Children:</span> {invoice.stayDetails?.children || 0}
          </p>
        </div>
      </div>

      {/* Aadhar Details */}
      {invoice.aadharDetails && invoice.aadharDetails.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            Aadhar Details:
          </h3>
          <div className="space-y-2">
            {invoice.aadharDetails.map((detail, idx) => (
              <p key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                {idx + 1}. {detail.personName} - {detail.aadharNumber}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Invoice Items */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-semibold text-gray-800 dark:text-white">
                Description
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-sm font-semibold text-gray-800 dark:text-white">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-800 dark:text-white">
                {invoice.stayDetails?.checkInDate && invoice.stayDetails?.checkOutDate ? (
                  <>
                    Stay for {Math.ceil(
                      (new Date(invoice.stayDetails.checkOutDate) - new Date(invoice.stayDetails.checkInDate)) /
                        (1000 * 60 * 60 * 24)
                    )} day(s) at {invoice.stayDetails?.homeId?.name || 'Home'}
                    {invoice.stayDetails?.homeId?.pricePerDay && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ({Math.ceil(
                          (new Date(invoice.stayDetails.checkOutDate) - new Date(invoice.stayDetails.checkInDate)) /
                            (1000 * 60 * 60 * 24)
                        )} days × ₹{invoice.stayDetails.homeId.pricePerDay.toFixed(2)}/day)
                      </div>
                    )}
                  </>
                ) : (
                  'Stay'
                )}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-sm text-gray-800 dark:text-white">
                ₹{invoice.pricing.baseAmount.toFixed(2)}
              </td>
            </tr>
            {invoice.pricing.discount.enabled &&
              invoice.pricing.discount.amount > 0 && (
                <tr>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-red-600 dark:text-red-400">
                    Discount
                    {invoice.pricing.discount.type === 'percentage'
                      ? ` (${invoice.pricing.discount.value}%)`
                      : ''}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-sm text-red-600 dark:text-red-400">
                    -₹{invoice.pricing.discount.amount.toFixed(2)}
                  </td>
                </tr>
              )}
            {invoice.isInternational && invoice.pricing.igstAmount > 0 && (
              <tr>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-800 dark:text-white">
                  IGST ({invoice.pricing.igstPercentage}%)
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-sm text-gray-800 dark:text-white">
                  ₹{invoice.pricing.igstAmount.toFixed(2)}
                </td>
              </tr>
            )}
            {!invoice.isInternational && (
              <>
                {invoice.pricing.cgstAmount > 0 && (
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-800 dark:text-white">
                      CGST ({invoice.pricing.cgstPercentage}%)
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-sm text-gray-800 dark:text-white">
                      ₹{invoice.pricing.cgstAmount.toFixed(2)}
                    </td>
                  </tr>
                )}
                {invoice.pricing.sgstAmount > 0 && (
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-800 dark:text-white">
                      SGST ({invoice.pricing.sgstPercentage}%)
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-sm text-gray-800 dark:text-white">
                      ₹{invoice.pricing.sgstAmount.toFixed(2)}
                    </td>
                  </tr>
                )}
              </>
            )}
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-800 dark:text-white">
                Total GST ({invoice.pricing.gstPercentage}%)
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-sm font-semibold text-gray-800 dark:text-white">
                ₹{invoice.pricing.gstAmount.toFixed(2)}
              </td>
            </tr>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-bold text-gray-800 dark:text-white">
                Total
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-sm font-bold text-blue-600 dark:text-blue-400">
                ₹{invoice.pricing.total.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-8 border-t border-gray-300 dark:border-gray-600">
        {settings?.gstNumber && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            GST Number: {settings.gstNumber}
          </p>
        )}
        {settings?.extraNotes && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
              Notes:
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
              {settings.extraNotes}
            </p>
          </div>
        )}
        {settings?.termsAndConditions && (
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
              Terms & Conditions:
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
              {settings.termsAndConditions}
            </p>
          </div>
        )}
        {settings?.signature && (
          <div className="mt-6 flex justify-end">
            <img
              src={`/api/uploads/${settings.signature}`}
              alt="Signature"
              className="h-20"
              onError={(e) => {
                console.error('Error loading signature in preview:', settings.signature);
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicePreview;

