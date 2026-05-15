namespace GradPath.Business.Exceptions;

public sealed class AuthFlowException : Exception
{
    public int StatusCode { get; }

    public AuthFlowException(string message, int statusCode)
        : base(message)
    {
        StatusCode = statusCode;
    }
}
